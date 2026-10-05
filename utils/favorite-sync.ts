import { useSettings } from '@/hooks/use-settings';

import { convexApi } from './convex-api';
import { accountMutation } from './convex-client';

/** Mirrors a favorite team change to the signed-in account. */
export async function syncFavorite(input: {
  animeSlug: string;
  provider: string;
  teamId?: string;
  teamTitle: string;
  translationType?: 'dub' | 'sub' | 'unknown';
}) {
  if (!useSettings.getState().convexSession) return;
  await accountMutation(convexApi.favorites.set, {
    favorite: {
      ...input,
      translationType: input.translationType ?? 'unknown',
      notificationsEnabled: true,
    },
  });
}

export async function removeSyncedFavorite(animeSlug: string) {
  if (!useSettings.getState().convexSession) return;
  await accountMutation(convexApi.favorites.remove, { animeSlug });
}
