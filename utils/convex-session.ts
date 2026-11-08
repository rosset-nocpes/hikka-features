// Background-only: owns the Hikka/Convex session. Other contexts reach it
// through `account` and `convex.account*`, which message the background.
import type { ConvexHttpClient } from 'convex/browser';

import {
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
  makeFunctionReference,
} from 'convex/server';

import { type FavoriteTeam, useSettings } from '@/hooks/use-settings';

import type { ConvexWatchTeam } from './convex-api';
import type { BackgroundMessage } from './messaging';

import { convexApi } from './convex-api';
import { CONVEX_SITE_URL, convex } from './convex-client';
import { favoriteTeamOf, findFavorite } from './favorite-team';
import { getHikkaViewerId } from './hikka-viewer';
import { loginState } from './login-state';
import { syncTeamPriority } from './team-priority-sync';

/** A watch response's team as favourites match it. */
const teamRef = ({ key, team, translationType }: ConvexWatchTeam) => ({
  key,
  id: team.id,
  slug: team.slug,
  title: team.title,
  translationType,
});

/** As long as the backend's login cookie lives. */
const LOGIN_TTL_MS = 15 * 60 * 1_000;
/** Where the backend ends the login tab, with `?error=` when it failed. */
const LOGIN_DONE_URL = `${CONVEX_SITE_URL}/auth/hikka/done`;

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
    convexApi.teamPriority.get,
    convexApi.teamPriority.set,
    convexApi.activity.report,
    convexApi.activity.clear,
    convexApi.activity.reportReading,
    convexApi.activity.clearReading,
    convexApi.activity.settings,
  ].map((reference) => getFunctionName(reference)),
);

/** Convex refused the access token itself, e.g. after its issuer changed. */
const tokenRejected = (error: unknown) =>
  error instanceof Error &&
  /"code":"(?:InvalidAuthHeader|NoAuthProvider)"/.test(error.message);

/** A URL of the backend's HTTP routes. */
function siteUrl(path: string) {
  if (!CONVEX_SITE_URL) {
    throw new Error('WXT_CONVEX_SITE_URL is not configured');
  }
  return `${CONVEX_SITE_URL}${path}`;
}

async function authRequest(path: string, body: object) {
  const response = await fetch(siteUrl(path), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
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

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

/** A random verifier and its SHA-256, which the login tab carries instead. */
async function loginChallenge() {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  );
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

/** Brings a tab, and its window where there are windows, to the front. */
async function focusTab(tabId: number) {
  const tab = await browser.tabs.update(tabId, { active: true });
  // Firefox for Android has no windows.
  if (tab?.windowId !== undefined) {
    await browser.windows?.update(tab.windowId, { focused: true });
  }
  return tab;
}

/**
 * What the login tab did: reached a URL, finished loading a page whose URL
 * is hidden from this extension, or was closed.
 */
type LoginTabEvent = { url: string } | 'loaded' | 'closed';

/** The settings once loaded, so a cold service worker sees the session. */
async function loadedSettings() {
  if (!useSettings.persist.hasHydrated()) {
    await new Promise<void>((resolve) => {
      const unsubscribe = useSettings.persist.onFinishHydration(() => {
        unsubscribe();
        resolve();
      });
    });
  }
  return useSettings.getState();
}

/**
 * The signed-in session: the refresh token in settings and the access token
 * minted from it, which only this context refreshes as refresh tokens rotate.
 */
class AccountSession {
  private accessToken?: { value: string; expiresAt: number };
  private refreshing?: Promise<string>;

  private loginQueue = Promise.resolve();

  /**
   * Opens hikka.io's consent page in a tab and returns: the session arrives
   * when that tab reaches the backend's done page (`onLoginTab`). Callers
   * wait with `awaitLogin`, as Chrome may restart this worker meanwhile.
   */
  async login(openerTabId?: number) {
    const startUrl = siteUrl('/auth/hikka/start');
    const current = await loginState.get();
    if (current?.status === 'pending' && current.expiresAt > Date.now()) {
      // Another click returns to the login tab instead of starting over.
      if (await focusTab(current.tabId).catch(() => undefined)) return;
    }

    openerTabId ??= await browser.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then(([tab]) => tab?.id)
      .catch(() => undefined);
    const { verifier, challenge } = await loginChallenge();
    const tab = await browser.tabs.create({
      url: `${startUrl}?challenge=${challenge}`,
    });
    if (tab.id === undefined) throw new Error('login_tab_failed');
    await loginState.set({
      status: 'pending',
      verifier,
      tabId: tab.id,
      openerTabId,
      expiresAt: Date.now() + LOGIN_TTL_MS,
    });
  }

  /**
   * Follows the login tab. Reaching the done page finishes the login; so
   * does loading a page whose URL this extension may not see, once the
   * session is ready. Closing the tab ends it, still claiming a ready one.
   */
  onLoginTab(tabId: number, event: LoginTabEvent) {
    if (typeof event === 'object' && !event.url.startsWith(LOGIN_DONE_URL)) {
      return;
    }
    // Queued, so closing the tab while its done page is handled is a no-op.
    this.loginQueue = this.loginQueue
      .then(() => this.finishLogin(tabId, event))
      .catch(console.error);
  }

  private async finishLogin(tabId: number, event: LoginTabEvent) {
    const login = await loginState.get();
    if (login?.status !== 'pending' || login.tabId !== tabId) return;

    const error =
      typeof event === 'object' && new URL(event.url).searchParams.get('error');
    // The done page explains it, so its tab stays open.
    if (error) return await loginState.set({ status: 'failed', error });

    let auth: AuthResponse;
    try {
      const response = await authRequest('/auth/session/exchange', {
        verifier: login.verifier,
      });
      auth = (await response.json()) as AuthResponse;
    } catch (cause) {
      const rejected = cause instanceof AuthError;
      // Not the done page yet, or offline and closing the tab tries again.
      if (
        (event === 'loaded' && rejected) ||
        (event !== 'closed' && !rejected)
      ) {
        return;
      }
      return await loginState.set({
        status: 'failed',
        // Closed before Hikka sent it back, nothing waits to be claimed.
        error:
          rejected && event === 'closed'
            ? 'cancelled'
            : cause instanceof Error
              ? cause.message
              : 'login_failed',
      });
    }

    // Hikka's callback carries no state, so a page could make this browser
    // finish someone else's login; only hikka.io's own user is kept.
    const viewerId = await getHikkaViewerId().catch(() => undefined);
    if (viewerId === auth.user.hikkaId) {
      await loadedSettings();
      this.store(auth);
      await loginState.remove();
      void this.sync();
    } else {
      await authRequest('/auth/session/revoke', {
        refreshToken: auth.refreshToken,
      }).catch(() => undefined);
      await loginState.set({
        status: 'failed',
        error:
          viewerId === undefined ? 'hikka_unavailable' : 'account_mismatch',
      });
    }

    if (event === 'closed') return;
    await browser.tabs.remove(tabId).catch(() => undefined);
    if (login.openerTabId !== undefined) {
      await focusTab(login.openerTabId).catch(() => undefined);
    }
  }

  async logout() {
    const session = (await loadedSettings()).convexSession;
    this.clear();
    if (session) {
      await authRequest('/auth/session/revoke', {
        refreshToken: session.refreshToken,
      }).catch(() => undefined);
    }
  }

  /**
   * Signs out once hikka.io has signed out or in as someone else, so the
   * account is always the site's user.
   */
  async followHikka(viewerId: string | null) {
    const { convexSession, userData } = await loadedSettings();
    if (convexSession && userData?.hikkaId !== viewerId) await this.logout();
  }

  /**
   * Lends an access token to a tab's live connection, or null when signed
   * out.
   */
  async lendToken(forceRefresh: boolean) {
    if (!(await loadedSettings()).convexSession) return null;
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
    await loadedSettings();
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
    if (!(await loadedSettings()).convexSession) return;

    const synced = await this.query(convexApi.favorites.list, {});
    const syncedSlugs = new Set(synced.map((favorite) => favorite.animeSlug));
    const localOnly: Record<string, FavoriteTeam> = {};

    const local = useSettings.getState().features.player.favoriteTeams;
    for (const [slug, favorite] of Object.entries(local)) {
      if (syncedSlugs.has(slug)) continue;
      try {
        const watch = await convex.action(convexApi.watch.resolve, { slug });
        const found = findFavorite(watch.teams.map(teamRef), favorite);
        if (!found) throw new Error('Team is no longer available');

        synced.push(
          await this.mutation(convexApi.favorites.set, {
            favorite: {
              animeSlug: slug,
              teamId: found.id,
              teamTitle: found.title,
              translationType: found.translationType,
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
            favoriteTeamOf({
              key: favorite.teamKey,
              id: favorite.teamId,
              title: favorite.teamTitle,
              translationType: favorite.translationType,
            }),
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
      if (!tokenRejected(error)) return await convex.explainFailure(error);
      // Another call may have replaced it already.
      if (this.accessToken?.value === token) this.accessToken = undefined;
      client.setAuth(await this.token());
      return await call(client).catch((retryError) =>
        convex.explainFailure(retryError),
      );
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
    const session = (await loadedSettings()).convexSession;
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
