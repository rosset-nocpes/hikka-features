import { ConvexClient, ConvexHttpClient } from 'convex/browser';
import {
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
} from 'convex/server';

import {
  COMPATIBILITY_STORAGE_KEY,
  type ExtensionCompatibilityState,
} from '@/utils/compatibility';
import { sendToBackground } from '@/utils/messaging';

export const CONVEX_URL = import.meta.env.WXT_CONVEX_URL ?? '';
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

  /** A client of its own, e.g. for one account call's token. */
  createClient() {
    return new ConvexHttpClient(requireConvexUrl());
  }

  /** Stops API calls once the backend reports this build as unsupported. */
  async assertCompatible() {
    const stored = await browser.storage.local.get(COMPATIBILITY_STORAGE_KEY);
    const state = stored[COMPATIBILITY_STORAGE_KEY] as
      | ExtensionCompatibilityState
      | undefined;
    if (
      state?.extensionVersion === browser.runtime.getManifest().version &&
      state.status === 'unsupported'
    ) {
      throw new Error('EXTENSION_UPDATE_REQUIRED');
    }
  }

  async query<Query extends FunctionReference<'query'>>(
    query: Query,
    args: Query['_args'],
  ): Promise<FunctionReturnType<Query>> {
    await this.assertCompatible();
    return await this.public().query(query, args);
  }

  async action<Action extends FunctionReference<'action'>>(
    action: Action,
    args: Action['_args'],
  ): Promise<FunctionReturnType<Action>> {
    await this.assertCompatible();
    return await this.public().action(action, args);
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

/**
 * The tab's WebSocket client for live account queries, shared by everyone
 * who needs one until the last of them releases it. The background keeps
 * the session and only lends it short-lived access tokens.
 */
class LiveConvex {
  private connection?: { client: ConvexClient; holders: number };

  async acquire() {
    await convex.assertCompatible();
    const connection = (this.connection ??= this.connect());
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
        void connection.client.close();
      },
    };
  }

  /** Makes one call on the live client, e.g. a mutation from a click. */
  async run<T>(call: (client: ConvexClient) => Promise<T>) {
    const { client, release } = await this.acquire();
    try {
      return await call(client);
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

  private connect() {
    // Otherwise hikka.io would ask to confirm leaving while a call is pending.
    const client = new ConvexClient(requireConvexUrl(), {
      unsavedChangesWarning: false,
    });
    client.setAuth(
      async ({ forceRefreshToken }) =>
        (await sendToBackground('convex-token', {
          forceRefresh: forceRefreshToken,
        })) ?? null,
    );
    return { client, holders: 0 };
  }
}

export const liveConvex = new LiveConvex();
