import { makeFunctionReference } from 'convex/server';

import type { CompatibilityResponse } from '@/utils/compatibility';

export interface ConvexWatchEpisode {
  number: number;
  title: {
    ua?: string;
    en?: string;
    ja?: string;
  };
  airedAt?: number;
  releasedAt?: number;
  fillerStatus?: 'filler' | 'mixed';
  episodeType?: 'canon' | 'filler' | 'mixed' | 'recap';
  playback: {
    kind: 'iframe';
    url: string;
  };
}

export interface ConvexWatchSource {
  key: string;
  team: {
    id?: string;
    title: string;
    logo?: string;
  };
  translationType: 'dub' | 'sub' | 'unknown';
  episodes: ConvexWatchEpisode[];
}

export interface ConvexWatchResult {
  anime: {
    id: string;
    slug: string;
    mediaType: 'tv' | 'movie' | 'ona' | 'unknown';
  };
  providers: Array<{
    id: string;
    language: 'uk' | 'en' | 'multi';
    sources: ConvexWatchSource[];
  }>;
  warnings: Array<{ provider: string; code: string }>;
  refreshedAt: number;
}

export interface SyncedFavorite {
  animeSlug: string;
  provider: string;
  teamId?: string;
  teamTitle: string;
  translationType: 'dub' | 'sub' | 'unknown';
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
  provider: string;
  playbackUrl: string;
  createdAt: number;
  seen: boolean;
}

export interface ReleaseNotificationMenu {
  notifications: ReleaseNotification[];
  unseenCount: number;
}

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
      { slug: string; force?: boolean },
      ConvexWatchResult
    >('watch:resolve'),
  },
  catalog: {
    get: makeFunctionReference<
      'action',
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
    list: makeFunctionReference<
      'query',
      Record<string, never>,
      SyncedFavorite[]
    >('favorites:list'),
    set: makeFunctionReference<
      'mutation',
      {
        favorite: {
          animeSlug: string;
          provider: string;
          teamTitle: string;
          teamId?: string;
          translationType: 'dub' | 'sub' | 'unknown';
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
    markAllSeen: makeFunctionReference<'mutation', Record<string, never>, null>(
      'notifications:markAllSeen',
    ),
  },
};
