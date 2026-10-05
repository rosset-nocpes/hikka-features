import { makeFunctionReference } from 'convex/server';

import type { CompatibilityResponse } from '@/utils/compatibility';

// Hand-written mirror of the backend contract (features-backend/convex).

type TranslationType = 'dub' | 'sub' | 'unknown';

export interface ConvexEpisodeInfo {
  number: number;
  title?: { ua?: string; en?: string; ja?: string };
  type?: 'canon' | 'filler' | 'mixed' | 'recap';
}

export interface ConvexWatchSource {
  /** Absent for providers that do not split playback by team. */
  team?: { id?: string; title: string; logo?: string };
  translationType: TranslationType;
  episodes: Array<{ number: number; url: string; releasedAt?: number }>;
}

export interface ConvexWatchResult {
  anime: { slug: string; mediaType: 'tv' | 'movie' | 'ona' | 'unknown' };
  providers: Array<{
    id: string;
    language: 'uk' | 'en' | 'multi';
    sources: ConvexWatchSource[];
  }>;
  episodes: ConvexEpisodeInfo[];
  warnings: Array<{ provider: string; code: string }>;
  refreshedAt: number;
}

export interface SyncedFavorite {
  animeSlug: string;
  provider: string;
  teamId?: string;
  teamTitle: string;
  translationType: TranslationType;
  notificationsEnabled: boolean;
  baselineEpisode: number;
  updatedAt: number;
}

export interface ReleaseNotification {
  id: string;
  animeSlug: string;
  animeTitle?: string;
  teamTitle: string;
  episodeNumber: number;
  episodeTitle?: string;
  createdAt: number;
  seen: boolean;
}

export interface ReleaseNotificationMenu {
  notifications: ReleaseNotification[];
  unseenCount: number;
}

type NoArgs = Record<string, never>;

export const convexApi = {
  compatibility: {
    get: makeFunctionReference<
      'query',
      { extensionVersion: string; protocol: number },
      CompatibilityResponse
    >('compatibility:get'),
  },
  watch: {
    resolve: makeFunctionReference<
      'action',
      { slug: string },
      ConvexWatchResult
    >('watch:resolve'),
  },
  catalog: {
    get: makeFunctionReference<
      'query',
      { slug: string },
      {
        poster?: string;
        fandub: Array<{ title: string; logo?: string; link: string }>;
      } | null
    >('catalog:get'),
  },
  editor: {
    suggest: makeFunctionReference<
      'action',
      { type: 'characters' | 'people'; slug: string },
      API.EditorContent
    >('editor:suggest'),
  },
  favorites: {
    list: makeFunctionReference<'query', NoArgs, SyncedFavorite[]>(
      'favorites:list',
    ),
    set: makeFunctionReference<
      'mutation',
      {
        favorite: {
          animeSlug: string;
          provider: string;
          teamTitle: string;
          teamId?: string;
          translationType: TranslationType;
          notificationsEnabled: boolean;
        };
      },
      SyncedFavorite
    >('favorites:set'),
    remove: makeFunctionReference<'mutation', { animeSlug: string }, null>(
      'favorites:remove',
    ),
  },
  notifications: {
    menu: makeFunctionReference<
      'query',
      { limit?: number },
      ReleaseNotificationMenu
    >('notifications:menu'),
    markSeen: makeFunctionReference<'mutation', { id: string }, null>(
      'notifications:markSeen',
    ),
    markAllSeen: makeFunctionReference<'mutation', NoArgs, null>(
      'notifications:markAllSeen',
    ),
  },
};
