import { useSettings } from '@/hooks/use-settings';

import { convexApi } from './convex-api';
import {
  CONVEX_URL,
  convexAction,
  convexMutation,
  convexQuery,
} from './convex-client';

export async function syncFavorite(input: {
  animeSlug: string;
  provider: string;
  teamId?: string;
  teamTitle: string;
  translationType?: 'dub' | 'sub' | 'unknown';
}) {
  if (!useSettings.getState().convexSession || !CONVEX_URL) return;
  await convexMutation(convexApi.favorites.set, {
    favorite: {
      ...input,
      translationType: input.translationType ?? 'unknown',
      notificationsEnabled: true,
    },
  });
}

export async function removeSyncedFavorite(animeSlug: string) {
  if (!useSettings.getState().convexSession || !CONVEX_URL) return;
  await convexMutation(convexApi.favorites.remove, { animeSlug });
}

export async function syncFavoritesFromConvex() {
  const state = useSettings.getState();
  if (!state.convexSession || !CONVEX_URL) return;

  let serverFavorites = await convexQuery(convexApi.favorites.list, {});
  const serverSlugs = new Set(
    serverFavorites.map((favorite) => favorite.animeSlug),
  );
  const localFavorites = state.features.player.favoriteTeams;

  for (const [animeSlug, favorite] of Object.entries(localFavorites)) {
    if (serverSlugs.has(animeSlug)) continue;
    try {
      const watch = await convexAction(convexApi.watch.resolve, {
        slug: animeSlug,
      });
      const provider = watch.providers.find(
        (candidate) => candidate.id === favorite.provider,
      );
      const source = provider?.sources.find(
        (candidate) => candidate.team.title === favorite.team,
      );
      if (!source) continue;
      await syncFavorite({
        animeSlug,
        provider: favorite.provider,
        teamId: source.team.id,
        teamTitle: source.team.title,
        translationType: source.translationType,
      });
    } catch {
      // Keep a local favorite when its old provider is no longer available.
    }
  }

  serverFavorites = await convexQuery(convexApi.favorites.list, {});
  const favoriteTeams = Object.fromEntries(
    serverFavorites.map((favorite) => [
      favorite.animeSlug,
      {
        provider: favorite.provider,
        team: favorite.teamTitle,
      },
    ]),
  );
  useSettings.getState().updateFeatureSettings('player', { favoriteTeams });
}
