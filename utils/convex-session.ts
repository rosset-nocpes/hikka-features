// Background-only: owns the Hikka/Convex session. Other contexts reach it
// through `accountQuery`/`accountMutation` and the login/logout messages.
import type { ConvexHttpClient } from 'convex/browser';

import {
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
  makeFunctionReference,
} from 'convex/server';

import { useSettings } from '@/hooks/use-settings';

import { convexApi } from './convex-api';
import {
  assertCompatible,
  CONVEX_SITE_URL,
  type ConvexAuthRequest,
  convexClient,
  publicAction,
} from './convex-client';
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

let accessToken: { value: string; expiresAt: number } | undefined;
let refreshing: Promise<string> | undefined;

async function authRequest(path: string, body?: unknown) {
  if (!CONVEX_SITE_URL)
    throw new Error('WXT_CONVEX_SITE_URL is not configured');
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

function storeSession(auth: AuthResponse) {
  accessToken = {
    value: auth.accessToken,
    expiresAt: Date.now() + (auth.accessTokenExpiresIn - 30) * 1_000,
  };
  useSettings.getState().setSettings({
    convexSession: { refreshToken: auth.refreshToken },
    userData: auth.user,
  });
  return auth.accessToken;
}

function clearSession() {
  accessToken = undefined;
  useSettings.getState().setSettings({
    convexSession: undefined,
    userData: undefined,
    // The next login merges this device's list into the account again.
    teamPrioritySyncedAt: 0,
  });
}

async function getAccessToken() {
  if (accessToken && accessToken.expiresAt > Date.now()) {
    return accessToken.value;
  }

  refreshing ??= (async () => {
    await settingsHydrated();
    const session = useSettings.getState().convexSession;
    if (!session) throw new Error('Not authenticated');
    try {
      const response = await authRequest('/auth/session/refresh', {
        refreshToken: session.refreshToken,
      });
      return storeSession((await response.json()) as AuthResponse);
    } catch (error) {
      // Only a rejected session logs out; network errors keep it for a retry.
      if (error instanceof AuthError && error.status === 401) clearSession();
      throw error;
    }
  })().finally(() => {
    refreshing = undefined;
  });
  return await refreshing;
}

/**
 * Lends an access token to a content script's live connection, or null when
 * signed out. Only the background refreshes, as refresh tokens rotate.
 */
export async function accountToken(forceRefresh: boolean) {
  await settingsHydrated();
  if (!useSettings.getState().convexSession) return null;
  if (forceRefresh) accessToken = undefined;
  return await getAccessToken().catch(() => null);
}

/** Convex refused the access token itself, e.g. after its issuer changed. */
const tokenRejected = (error: unknown) =>
  error instanceof Error &&
  /"code":"(?:InvalidAuthHeader|NoAuthProvider)"/.test(error.message);

/**
 * Makes an account call, minting a new access token once when Convex no
 * longer accepts the cached one.
 */
async function withAccount<T>(call: (client: ConvexHttpClient) => Promise<T>) {
  await assertCompatible();
  const client = convexClient();
  const token = await getAccessToken();
  client.setAuth(token);
  try {
    return await call(client);
  } catch (error) {
    if (!tokenRejected(error)) throw error;
    // Another call may have replaced it already.
    if (accessToken?.value === token) accessToken = undefined;
    client.setAuth(await getAccessToken());
    return await call(client);
  }
}

async function query<Query extends FunctionReference<'query'>>(
  reference: Query,
  args: Query['_args'],
): Promise<FunctionReturnType<Query>> {
  return await withAccount((client) => client.query(reference, args));
}

async function mutation<Mutation extends FunctionReference<'mutation'>>(
  reference: Mutation,
  args: Mutation['_args'],
): Promise<FunctionReturnType<Mutation>> {
  return await withAccount((client) => client.mutation(reference, args));
}

/** Executes an account call forwarded by a content script or the popup. */
export async function runAccountRequest(request: ConvexAuthRequest) {
  if (!ACCOUNT_FUNCTIONS.has(request.name)) {
    throw new Error(`Convex function ${request.name} is not allowed`);
  }
  return request.kind === 'query'
    ? await query(makeFunctionReference<'query'>(request.name), request.args)
    : await mutation(
        makeFunctionReference<'mutation'>(request.name),
        request.args,
      );
}

export async function login() {
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
    throw new Error(params.get('error') ?? 'Hikka login did not return a code');
  }

  const response = await authRequest('/auth/session/exchange', { code });
  const auth = (await response.json()) as AuthResponse;
  storeSession(auth);
  return auth.user;
}

export async function logout() {
  await settingsHydrated();
  const session = useSettings.getState().convexSession;
  clearSession();
  if (session) {
    await authRequest('/auth/session/revoke', {
      refreshToken: session.refreshToken,
    }).catch(() => undefined);
  }
}

export async function syncAccountTeamPriority() {
  await settingsHydrated();
  await syncTeamPriority({
    get: () => query(convexApi.teamPriority.get, {}),
    set: (input) => mutation(convexApi.teamPriority.set, input),
  });
}

/**
 * Uploads favorites that only exist locally, then mirrors the account's
 * favorites into local settings. Favorites whose team can no longer be found
 * stay local-only.
 */
export async function syncFavorites() {
  await settingsHydrated();
  if (!useSettings.getState().convexSession) return;

  const account = await query(convexApi.favorites.list, {});
  const synced = new Set(account.map((favorite) => favorite.animeSlug));
  const localOnly: Record<string, { provider: string; team: string }> = {};

  const local = useSettings.getState().features.player.favoriteTeams;
  for (const [slug, favorite] of Object.entries(local)) {
    if (synced.has(slug)) continue;
    try {
      const watch = await publicAction(convexApi.watch.resolve, { slug });
      const source = watch.providers
        .find((provider) => provider.id === favorite.provider)
        ?.sources.find(
          (candidate) =>
            candidate.team &&
            looseKey(candidate.team.title) === looseKey(favorite.team),
        );
      if (!source?.team) throw new Error('Team is no longer available');

      account.push(
        await mutation(convexApi.favorites.set, {
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
        account.map((favorite) => [
          favorite.animeSlug,
          { provider: favorite.provider, team: favorite.teamTitle },
        ]),
      ),
    },
  });
}
