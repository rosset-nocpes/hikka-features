import { useQuery } from '@tanstack/react-query';

import { useSettings } from '@/hooks/use-settings';

const HIKKA_PROFILE_URL = 'https://api.hikka.io/user/me';

/**
 * The Hikka user signed in to hikka.io in this browser, which need not be
 * the extension's account; account content is only shown to that user.
 */
export async function getHikkaViewerId() {
  const response = await fetch(HIKKA_PROFILE_URL, {
    cache: 'no-store',
    credentials: 'include',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return undefined;

  const profile = (await response.json()) as { reference?: unknown };
  return typeof profile.reference === 'string' ? profile.reference : undefined;
}

/**
 * Who is on hikka.io: `guest`, the extension's `account`, or `other` (also
 * when the extension isn't signed in). Undefined until known.
 */
export function useHikkaViewer() {
  const hikkaId = useSettings((state) =>
    state.convexSession ? state.userData?.hikkaId : undefined,
  );
  const { data: viewerId } = useQuery({
    queryKey: ['hikka-viewer-id'],
    // Guests have none, and a query can't resolve to undefined.
    queryFn: async () => (await getHikkaViewerId()) ?? null,
    staleTime: Infinity,
    retry: false,
  });

  if (viewerId === undefined) return undefined;
  if (viewerId === null) return 'guest';
  return viewerId === hikkaId ? 'account' : 'other';
}
