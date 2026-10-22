import { queryOptions, useQuery } from '@tanstack/react-query';

import { useSettings } from '@/hooks/use-settings';

const HIKKA_PROFILE_URL = 'https://api.hikka.io/user/me';

/**
 * The Hikka user signed in to hikka.io in this browser, which need not be
 * the extension's account, or null for a guest. Throws when hikka.io
 * couldn't tell.
 */
export async function getHikkaViewerId() {
  const response = await fetch(HIKKA_PROFILE_URL, {
    cache: 'no-store',
    credentials: 'include',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  const body = (await response.json().catch(() => undefined)) as
    | { reference?: unknown; code?: unknown }
    | undefined;

  if (response.ok && typeof body?.reference === 'string') {
    return body.reference;
  }
  // A missing, expired or revoked session; other failures say nothing.
  if (typeof body?.code === 'string' && body.code.startsWith('auth:')) {
    return null;
  }
  throw new Error(`Hikka profile request failed: ${response.status}`);
}

/** Shared, so a fresh check reaches everyone who gates content on it. */
export const hikkaViewerQuery = queryOptions({
  queryKey: ['hikka-viewer-id'],
  queryFn: getHikkaViewerId,
  staleTime: Infinity,
  retry: false,
});

/**
 * Who is on hikka.io: `guest`, the extension's `account`, or `other` (also
 * when the extension isn't signed in). Undefined until known.
 */
export function useHikkaViewer() {
  const hikkaId = useSettings((state) =>
    state.convexSession ? state.userData?.hikkaId : undefined,
  );
  const { data: viewerId } = useQuery(hikkaViewerQuery);

  if (viewerId === undefined) return undefined;
  if (viewerId === null) return 'guest';
  return viewerId === hikkaId ? 'account' : 'other';
}
