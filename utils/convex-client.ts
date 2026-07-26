import type { FunctionReference } from 'convex/server';

import { ConvexHttpClient } from 'convex/browser';

import { useSettings } from '@/hooks/use-settings';

export const CONVEX_URL = import.meta.env.WXT_CONVEX_URL ?? '';
export const CONVEX_SITE_URL = import.meta.env.WXT_CONVEX_SITE_URL ?? '';

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  user: UserDataV2;
}

let accessToken:
  | {
      value: string;
      expiresAt: number;
    }
  | undefined;
let refreshPromise: Promise<string | undefined> | undefined;

function backendClient() {
  if (!CONVEX_URL) {
    throw new Error('WXT_CONVEX_URL is not configured');
  }
  return new ConvexHttpClient(CONVEX_URL);
}

async function authRequest(path: string, body: unknown) {
  if (!CONVEX_SITE_URL) {
    throw new Error('WXT_CONVEX_SITE_URL is not configured');
  }
  const response = await fetch(`${CONVEX_SITE_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => undefined)) as
      | { error?: string }
      | undefined;
    throw new Error(data?.error ?? `Authentication failed: ${response.status}`);
  }
  return response;
}

function acceptAuth(response: AuthResponse) {
  accessToken = {
    value: response.accessToken,
    expiresAt:
      Date.now() + Math.max(response.accessTokenExpiresIn - 30, 1) * 1_000,
  };
  useSettings.getState().setSettings({
    convexSession: { refreshToken: response.refreshToken },
    userData: response.user,
  });
  return response.accessToken;
}

export async function getHikkaAuthorizationUrl(redirectUri: string) {
  if (!CONVEX_SITE_URL) {
    throw new Error('WXT_CONVEX_SITE_URL is not configured');
  }
  const url = new URL(`${CONVEX_SITE_URL}/auth/hikka/start`);
  url.searchParams.set('redirect_uri', redirectUri);
  const response = await fetch(url);
  if (!response.ok) {
    const data = (await response.json().catch(() => undefined)) as
      | { error?: string }
      | undefined;
    throw new Error(data?.error ?? `Authentication failed: ${response.status}`);
  }
  const data = (await response.json()) as { authorizationUrl?: string };
  if (!data.authorizationUrl) {
    throw new Error(
      'Authentication server did not return an authorization URL',
    );
  }
  return data.authorizationUrl;
}

export async function exchangeLoginCode(code: string) {
  const response = await authRequest('/auth/session/exchange', { code });
  const auth = (await response.json()) as AuthResponse;
  acceptAuth(auth);
  return auth;
}

export async function getAccessToken(force = false) {
  if (!force && accessToken && accessToken.expiresAt > Date.now()) {
    return accessToken.value;
  }
  if (refreshPromise) return await refreshPromise;

  refreshPromise = (async () => {
    const session = useSettings.getState().convexSession;
    if (!session) return undefined;
    try {
      const response = await authRequest('/auth/session/refresh', {
        refreshToken: session.refreshToken,
      });
      return acceptAuth((await response.json()) as AuthResponse);
    } catch (error) {
      accessToken = undefined;
      useSettings.getState().setSettings({
        convexSession: undefined,
        userData: undefined,
      });
      throw error;
    }
  })().finally(() => {
    refreshPromise = undefined;
  });

  return await refreshPromise;
}

async function authenticatedClient() {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');
  const client = backendClient();
  client.setAuth(token);
  return client;
}

export async function convexQuery<Reference extends FunctionReference<'query'>>(
  reference: Reference,
  args: Reference['_args'],
) {
  return await (await authenticatedClient()).query(reference, args);
}

export async function convexMutation<
  Reference extends FunctionReference<'mutation'>,
>(reference: Reference, args: Reference['_args']) {
  return await (await authenticatedClient()).mutation(reference, args);
}

export async function convexAction<
  Reference extends FunctionReference<'action'>,
>(reference: Reference, args: Reference['_args']) {
  return await backendClient().action(reference, args);
}

export async function revokeConvexSession() {
  const session = useSettings.getState().convexSession;
  accessToken = undefined;
  useSettings.getState().setSettings({
    convexSession: undefined,
    userData: undefined,
  });
  if (!session || !CONVEX_SITE_URL) return;
  await authRequest('/auth/session/revoke', {
    refreshToken: session.refreshToken,
  }).catch(() => undefined);
}
