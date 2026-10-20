// Background-only: owns the Hikka/Convex session. Other contexts reach it
// through `account` and `convex.account*`, which message the background.
import type { ConvexHttpClient } from 'convex/browser';

import {
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
  makeFunctionReference,
} from 'convex/server';

import { useSettings } from '@/hooks/use-settings';

import type { BackgroundMessage } from './messaging';

import { convexApi } from './convex-api';
import { CONVEX_SITE_URL, convex } from './convex-client';
import { syncTeamPriority } from './team-priority-sync';
import { looseKey } from './utils';

interface AuthResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  user: UserDataV2;
}

class AuthError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
  }
}

/** The account functions tabs may call through the background. */
const ACCOUNT_FUNCTIONS = new Set(
  [
    convexApi.favorites.list,
    convexApi.favorites.set,
    convexApi.favorites.remove,
    convexApi.notifications.menu,
    convexApi.notifications.markSeen,
    convexApi.notifications.markAllSeen,
    convexApi.teamPriority.get,
    convexApi.teamPriority.set,
    convexApi.activity.report,
    convexApi.activity.clear,
    convexApi.activity.settings,
    convexApi.activity.setSharing,
  ].map((reference) => getFunctionName(reference)),
);

/** Convex refused the access token itself, e.g. after its issuer changed. */
const tokenRejected = (error: unknown) =>
  error instanceof Error &&
  /"code":"(?:InvalidAuthHeader|NoAuthProvider)"/.test(error.message);

async function authRequest(path: string, body?: unknown) {
  if (!CONVEX_SITE_URL) {
    throw new Error('WXT_CONVEX_SITE_URL is not configured');
  }
  const response = await fetch(
    `${CONVEX_SITE_URL}${path}`,
    body === undefined
      ? undefined
      : {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => undefined)) as
      | { error?: string }
      | undefined;
    throw new AuthError(
      data?.error ?? `http_${response.status}`,
      response.status,
    );
  }
  return response;
}

/** Waits for persisted settings so a cold service worker sees the session. */
function settingsHydrated() {
  return new Promise<void>((resolve) => {
    const unsubscribe = useSettings.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
    if (useSettings.persist.hasHydrated()) {
      unsubscribe();
      resolve();
    }
  });
}

/**
 * The signed-in session: the refresh token in settings and the access token
 * minted from it, which only this context refreshes as refresh tokens rotate.
 */
class AccountSession {
  private accessToken?: { value: string; expiresAt: number };
  private refreshing?: Promise<string>;

  async login() {
    const redirectUri = browser.identity.getRedirectURL();
    const start = await authRequest(
      `/auth/hikka/start?redirect_uri=${encodeURIComponent(redirectUri)}`,
    );
    const { authorizationUrl } = (await start.json()) as {
      authorizationUrl?: string;
    };
    if (!authorizationUrl) {
      throw new Error(
        'Authentication server did not return an authorization URL',
      );
    }

    const responseUrl = await browser.identity.launchWebAuthFlow({
      interactive: true,
      url: authorizationUrl,
    });
    if (!responseUrl) throw new Error('Hikka login was cancelled');

    const params = new URL(responseUrl).searchParams;
    const code = params.get('code');
    if (!code) {
      throw new Error(
        params.get('error') ?? 'Hikka login did not return a code',
      );
    }

    const response = await authRequest('/auth/session/exchange', { code });
    const auth = (await response.json()) as AuthResponse;
    this.store(auth);
    return auth.user;
  }

  async logout() {
    await settingsHydrated();
    const session = useSettings.getState().convexSession;
    this.clear();
    if (session) {
      await authRequest('/auth/session/revoke', {
        refreshToken: session.refreshToken,
      }).catch(() => undefined);
    }
  }

  /**
   * Lends an access token to a tab's live connection, or null when signed
   * out.
   */
  async lendToken(forceRefresh: boolean) {
    await settingsHydrated();
    if (!useSettings.getState().convexSession) return null;
    if (forceRefresh) this.accessToken = undefined;
    return await this.token().catch(() => null);
  }

  /** Makes an account call a tab or the popup forwarded. */
  async run({ kind, name, args }: BackgroundMessage<'convex-auth'>) {
    if (!ACCOUNT_FUNCTIONS.has(name)) {
      throw new Error(`Convex function ${name} is not allowed`);
    }
    return kind === 'query'
      ? await this.query(makeFunctionReference<'query'>(name), args)
      : await this.mutation(makeFunctionReference<'mutation'>(name), args);
  }

  /** Brings the account and this device's settings level. */
  async sync() {
    await Promise.all([
      this.syncFavorites().catch(console.error),
      this.syncTeamPriority().catch(console.error),
    ]);
  }

  async syncTeamPriority() {
    await settingsHydrated();
    await syncTeamPriority({
      get: () => this.query(convexApi.teamPriority.get, {}),
      set: (input) => this.mutation(convexApi.teamPriority.set, input),
    });
  }

  /**
   * Uploads favorites that only exist locally, then mirrors the account's
   * favorites into local settings. Favorites whose team can no longer be
   * found stay local-only.
   */
  async syncFavorites() {
    await settingsHydrated();
    if (!useSettings.getState().convexSession) return;

    const synced = await this.query(convexApi.favorites.list, {});
    const syncedSlugs = new Set(synced.map((favorite) => favorite.animeSlug));
    const localOnly: Record<string, { provider: string; team: string }> = {};

    const local = useSettings.getState().features.player.favoriteTeams;
    for (const [slug, favorite] of Object.entries(local)) {
      if (syncedSlugs.has(slug)) continue;
      try {
        const watch = await convex.action(convexApi.watch.resolve, { slug });
        const source = watch.providers
          .find((provider) => provider.id === favorite.provider)
          ?.sources.find(
            (candidate) =>
              candidate.team &&
              looseKey(candidate.team.title) === looseKey(favorite.team),
          );
        if (!source?.team) throw new Error('Team is no longer available');

        synced.push(
          await this.mutation(convexApi.favorites.set, {
            favorite: {
              animeSlug: slug,
              provider: favorite.provider,
              teamId: source.team.id,
              teamTitle: source.team.title,
              translationType: source.translationType,
              notificationsEnabled: true,
            },
          }),
        );
      } catch {
        localOnly[slug] = favorite;
      }
    }

    useSettings.getState().updateFeatureSettings('player', {
      favoriteTeams: {
        ...localOnly,
        ...Object.fromEntries(
          synced.map((favorite) => [
            favorite.animeSlug,
            { provider: favorite.provider, team: favorite.teamTitle },
          ]),
        ),
      },
    });
  }

  private async query<Query extends FunctionReference<'query'>>(
    reference: Query,
    args: Query['_args'],
  ): Promise<FunctionReturnType<Query>> {
    return await this.withClient((client) => client.query(reference, args));
  }

  private async mutation<Mutation extends FunctionReference<'mutation'>>(
    reference: Mutation,
    args: Mutation['_args'],
  ): Promise<FunctionReturnType<Mutation>> {
    return await this.withClient((client) => client.mutation(reference, args));
  }

  /**
   * Makes an account call, minting a new access token once when Convex no
   * longer accepts the cached one.
   */
  private async withClient<T>(call: (client: ConvexHttpClient) => Promise<T>) {
    await convex.assertCompatible();
    const client = convex.createClient();
    const token = await this.token();
    client.setAuth(token);
    try {
      return await call(client);
    } catch (error) {
      if (!tokenRejected(error)) throw error;
      // Another call may have replaced it already.
      if (this.accessToken?.value === token) this.accessToken = undefined;
      client.setAuth(await this.token());
      return await call(client);
    }
  }

  private async token() {
    if (this.accessToken && this.accessToken.expiresAt > Date.now()) {
      return this.accessToken.value;
    }

    this.refreshing ??= this.refresh().finally(() => {
      this.refreshing = undefined;
    });
    return await this.refreshing;
  }

  private async refresh() {
    await settingsHydrated();
    const session = useSettings.getState().convexSession;
    if (!session) throw new Error('Not authenticated');
    try {
      const response = await authRequest('/auth/session/refresh', {
        refreshToken: session.refreshToken,
      });
      return this.store((await response.json()) as AuthResponse);
    } catch (error) {
      // Only a rejected session logs out; network errors keep it for a retry.
      if (error instanceof AuthError && error.status === 401) this.clear();
      throw error;
    }
  }

  private store(auth: AuthResponse) {
    this.accessToken = {
      value: auth.accessToken,
      expiresAt: Date.now() + (auth.accessTokenExpiresIn - 30) * 1_000,
    };
    useSettings.getState().setSettings({
      convexSession: { refreshToken: auth.refreshToken },
      userData: auth.user,
    });
    return auth.accessToken;
  }

  private clear() {
    this.accessToken = undefined;
    useSettings.getState().setSettings({
      convexSession: undefined,
      userData: undefined,
      // The next login merges this device's list into the account again.
      teamPrioritySyncedAt: 0,
    });
  }
}

export const accountSession = new AccountSession();
