import { ConvexClient, ConvexHttpClient } from 'convex/browser';
import {
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
} from 'convex/server';
import { ConvexError } from 'convex/values';

import {
  RECHECK_INTERVAL,
  TOKEN_TIMEOUT,
  SUSPECT_RETRIES,
  REAUTH_DELAYS,
} from '@/constants/account';
import { useSettings } from '@/hooks/use-settings';
import {
  compatibilityState,
  currentCompatibility,
  EXTENSION_API_PROTOCOL,
} from '@/utils/compatibility';
import { convexApi } from '@/utils/convex-api';
import { sendToBackground } from '@/utils/messaging';

const CONVEX_URL = import.meta.env.WXT_CONVEX_URL ?? '';
export const CONVEX_SITE_URL = import.meta.env.WXT_CONVEX_SITE_URL ?? '';

const requireConvexUrl = () => {
  if (!CONVEX_URL) throw new Error('WXT_CONVEX_URL is not configured');
  return CONVEX_URL;
};

/**
 * The backend over HTTP. Public calls go straight to it; account calls go
 * through the background, which owns the session. Refresh tokens rotate on
 * use, so letting every tab refresh on its own would race.
 */
class Convex {
  private publicClient?: ConvexHttpClient;
  private lastRecheck = 0;
  private rechecking?: Promise<void>;

  /** A client of its own, e.g. for one account call's token. */
  createClient() {
    return new ConvexHttpClient(requireConvexUrl());
  }

  /** Asks the backend whether it still serves this build, and stores it. */
  async refreshCompatibility() {
    const extensionVersion = browser.runtime.getManifest().version;
    const compatibility = await this.createClient().query(
      convexApi.compatibility.get,
      { extensionVersion, protocol: EXTENSION_API_PROTOCOL },
    );
    await compatibilityState.set({
      ...compatibility,
      extensionVersion,
      checkedAt: Date.now(),
    });
  }

  /**
   * Rethrows a failed call's error, as `EXTENSION_UPDATE_REQUIRED` when the
   * backend has dropped this build since the last check. A backend that
   * changed under an old build fails with plain errors (a missing function,
   * rejected arguments), so those recheck, at most once a minute.
   */
  async explainFailure(error: unknown): Promise<never> {
    if (!(error instanceof ConvexError)) {
      if (Date.now() - this.lastRecheck > RECHECK_INTERVAL) {
        this.lastRecheck = Date.now();
        this.rechecking ??= this.refreshCompatibility()
          .catch(console.error)
          .finally(() => {
            this.rechecking = undefined;
          });
      }
      await this.rechecking;
      await this.assertCompatible();
    }
    throw error;
  }

  /** Stops API calls once the backend reports this build as unsupported. */
  async assertCompatible() {
    if ((await currentCompatibility())?.status === 'unsupported') {
      throw new Error('EXTENSION_UPDATE_REQUIRED');
    }
  }

  async query<Query extends FunctionReference<'query'>>(
    query: Query,
    args: Query['_args'],
  ): Promise<FunctionReturnType<Query>> {
    await this.assertCompatible();
    return await this.public()
      .query(query, args)
      .catch((error) => this.explainFailure(error));
  }

  /** `skipQueue`: not behind this tab's other mutations, which may be stuck. */
  async mutation<Mutation extends FunctionReference<'mutation'>>(
    mutation: Mutation,
    args: Mutation['_args'],
    options?: { skipQueue: boolean },
  ): Promise<FunctionReturnType<Mutation>> {
    await this.assertCompatible();
    return await this.public()
      .mutation(mutation, args, options)
      .catch((error) => this.explainFailure(error));
  }

  async action<Action extends FunctionReference<'action'>>(
    action: Action,
    args: Action['_args'],
  ): Promise<FunctionReturnType<Action>> {
    await this.assertCompatible();
    return await this.public()
      .action(action, args)
      .catch((error) => this.explainFailure(error));
  }

  async accountQuery<Query extends FunctionReference<'query'>>(
    query: Query,
    args: Query['_args'],
  ): Promise<FunctionReturnType<Query>> {
    return await sendToBackground('convex-auth', {
      kind: 'query',
      name: getFunctionName(query),
      args,
    });
  }

  async accountMutation<Mutation extends FunctionReference<'mutation'>>(
    mutation: Mutation,
    args: Mutation['_args'],
  ): Promise<FunctionReturnType<Mutation>> {
    return await sendToBackground('convex-auth', {
      kind: 'mutation',
      name: getFunctionName(mutation),
      args,
    });
  }

  private public() {
    return (this.publicClient ??= this.createClient());
  }
}

export const convex = new Convex();

/** Who the extension is signed in as, or undefined when signed out. */
const accountOf = (state: ReturnType<typeof useSettings.getState>) =>
  state.convexSession ? (state.userData?.hikkaId ?? '') : undefined;

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/**
 * A tab's WebSocket client and its sign-in. Convex fetches a new token only
 * when the server answers with an auth error; the self-hosted backend drops
 * the socket instead, so the client would retry a refused token forever and
 * account queries would never answer. Failed reconnects in a row, a refused
 * sign-in and a change of account all sign in again with a fresh token.
 */
class LiveConnection {
  readonly client: ConvexClient;
  holders = 0;
  /** The last token lent, kept for when the background can't lend one. */
  private token?: string;
  private forceRefresh = false;
  private failures = 0;
  private retry?: { timer: ReturnType<typeof setTimeout>; socket: boolean };
  private readonly stops: (() => void)[];

  constructor(url: string) {
    // Otherwise hikka.io would ask to confirm leaving while a call is pending.
    this.client = new ConvexClient(url, { unsavedChangesWarning: false });
    this.authenticate();
    this.stops = [
      this.client.subscribeToConnectionState(
        ({ isWebSocketConnected, connectionRetries }) => {
          if (connectionRetries >= SUSPECT_RETRIES) this.scheduleRetry(true);
          else if (isWebSocketConnected && this.retry?.socket) {
            this.cancelRetry();
          }
        },
      ),
      useSettings.subscribe((state, previous) => {
        if (accountOf(state) === accountOf(previous)) return;
        this.failures = 0;
        this.authenticate();
      }),
    ];
  }

  close() {
    for (const stop of this.stops) stop();
    this.cancelRetry();
    void this.client.close();
  }

  private authenticate() {
    this.cancelRetry();
    this.client.setAuth(
      (args) => this.fetchToken(args),
      (authenticated) => {
        if (!authenticated) return this.scheduleRetry(false);
        this.failures = 0;
        this.cancelRetry();
      },
    );
  }

  /**
   * Never throws: the client pauses the socket while it waits for a token
   * and would leave it paused.
   */
  private async fetchToken({
    forceRefreshToken,
  }: {
    forceRefreshToken: boolean;
  }) {
    const forceRefresh = forceRefreshToken || this.forceRefresh;
    this.forceRefresh = false;
    try {
      this.token =
        (await withTimeout(
          sendToBackground('convex-token', { forceRefresh }),
          TOKEN_TIMEOUT,
        )) ?? undefined;
    } catch (error) {
      console.error(error);
      // The last token keeps the connection going until a retry.
      this.scheduleRetry(false);
    }
    return this.token ?? null;
  }

  private scheduleRetry(socket: boolean) {
    if (this.retry || accountOf(useSettings.getState()) === undefined) return;
    const delay =
      REAUTH_DELAYS[Math.min(this.failures, REAUTH_DELAYS.length - 1)];
    this.failures += 1;
    const timer = setTimeout(() => {
      this.retry = undefined;
      this.forceRefresh = true;
      this.authenticate();
    }, delay);
    this.retry = { timer, socket };
  }

  private cancelRetry() {
    if (!this.retry) return;
    clearTimeout(this.retry.timer);
    this.retry = undefined;
  }
}

/**
 * The tab's WebSocket client for live account queries, shared by everyone
 * who needs one until the last of them releases it. The background keeps
 * the session and only lends it short-lived access tokens.
 */
class LiveConvex {
  private connection?: LiveConnection;

  async acquire() {
    await convex.assertCompatible();
    const connection = (this.connection ??= new LiveConnection(
      requireConvexUrl(),
    ));
    connection.holders += 1;
    let released = false;
    return {
      client: connection.client,
      release: () => {
        if (released) return;
        released = true;
        connection.holders -= 1;
        if (connection.holders > 0 || this.connection !== connection) return;
        this.connection = undefined;
        connection.close();
      },
    };
  }

  /** Makes one call on the live client, e.g. a mutation from a click. */
  async run<T>(call: (client: ConvexClient) => Promise<T>) {
    const { client, release } = await this.acquire();
    try {
      return await call(client).catch((error) => convex.explainFailure(error));
    } finally {
      release();
    }
  }

  mutation<Mutation extends FunctionReference<'mutation'>>(
    mutation: Mutation,
    args: Mutation['_args'],
  ) {
    return this.run((client) => client.mutation(mutation, args));
  }

  action<Action extends FunctionReference<'action'>>(
    action: Action,
    args: Action['_args'],
  ) {
    return this.run((client) => client.action(action, args));
  }
}

export const liveConvex = new LiveConvex();
