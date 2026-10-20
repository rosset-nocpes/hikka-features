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
import { convexApi } from '@/utils/convex-api';

export const CONVEX_URL = import.meta.env.WXT_CONVEX_URL ?? '';
export const CONVEX_SITE_URL = import.meta.env.WXT_CONVEX_SITE_URL ?? '';

export interface ConvexAuthRequest {
  type: 'convex-auth';
  kind: 'query' | 'mutation';
  name: string;
  args: Record<string, unknown>;
}

export interface ConvexTokenRequest {
  type: 'convex-token';
  forceRefresh: boolean;
}

export function convexClient() {
  if (!CONVEX_URL) throw new Error('WXT_CONVEX_URL is not configured');
  return new ConvexHttpClient(CONVEX_URL);
}

/** Stops API calls once the backend reports this build as unsupported. */
export async function assertCompatible() {
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

export async function publicQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: Query['_args'],
): Promise<FunctionReturnType<Query>> {
  await assertCompatible();
  return await convexClient().query(query, args);
}

export async function publicAction<Action extends FunctionReference<'action'>>(
  action: Action,
  args: Action['_args'],
): Promise<FunctionReturnType<Action>> {
  await assertCompatible();
  return await convexClient().action(action, args);
}

/**
 * Account-scoped calls run in the background, which owns the session. Refresh
 * tokens rotate on use, so letting every tab refresh on its own would race.
 */
function viaBackground(
  kind: ConvexAuthRequest['kind'],
  reference: FunctionReference<typeof kind>,
  args: Record<string, unknown>,
) {
  return browser.runtime.sendMessage({
    type: 'convex-auth',
    kind,
    name: getFunctionName(reference),
    args,
  } satisfies ConvexAuthRequest);
}

let live: { client: ConvexClient; holders: number } | undefined;

/**
 * The tab's WebSocket client for live account queries, shared by everyone
 * who needs one until the last of them calls `release`. The background keeps
 * the session and only lends it short-lived access tokens.
 */
export async function acquireLiveClient() {
  await assertCompatible();
  if (!CONVEX_URL) throw new Error('WXT_CONVEX_URL is not configured');

  if (!live) {
    // Otherwise hikka.io would ask to confirm leaving while a call is pending.
    const client = new ConvexClient(CONVEX_URL, {
      unsavedChangesWarning: false,
    });
    client.setAuth(
      async ({ forceRefreshToken }) =>
        ((await browser.runtime.sendMessage({
          type: 'convex-token',
          forceRefresh: forceRefreshToken,
        } satisfies ConvexTokenRequest)) as string | null) ?? null,
    );
    live = { client, holders: 0 };
  }

  const current = live;
  current.holders += 1;
  let released = false;
  return {
    client: current.client,
    release: () => {
      if (released) return;
      released = true;
      current.holders -= 1;
      if (current.holders > 0 || live !== current) return;
      live = undefined;
      void current.client.close();
    },
  };
}

/** Reads the user's mutual follows again; the server limits how often. */
export const refreshFriends = () =>
  withLiveClient((client) =>
    client.action(convexApi.friends.refresh, {}),
  ).catch(console.error);

/** Makes one call on the live client, e.g. a mutation from a click. */
export async function withLiveClient<T>(
  call: (client: ConvexClient) => Promise<T>,
) {
  const { client, release } = await acquireLiveClient();
  try {
    return await call(client);
  } finally {
    release();
  }
}

export async function accountQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: Query['_args'],
): Promise<FunctionReturnType<Query>> {
  return await viaBackground('query', query, args);
}

export async function accountMutation<
  Mutation extends FunctionReference<'mutation'>,
>(
  mutation: Mutation,
  args: Mutation['_args'],
): Promise<FunctionReturnType<Mutation>> {
  return await viaBackground('mutation', mutation, args);
}
