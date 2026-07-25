import { makeFunctionReference } from 'convex/server';

export interface ConvexWatchEpisode {
  number: number;
  title: {
    ua?: string;
    en?: string;
    ja?: string;
  };
  airedAt?: number;
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
  teamTitle: string;
  episodeNumber: number;
  episodeTitle?: string;
  provider: string;
  playbackUrl: string;
  createdAt: number;
}

export const convexApi = {
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
    unread: makeFunctionReference<
      'query',
      { limit?: number },
      ReleaseNotification[]
    >('notifications:unread'),
    markDelivered: makeFunctionReference<'mutation', { ids: string[] }, null>(
      'notifications:markDelivered',
    ),
    markRead: makeFunctionReference<'mutation', { id: string }, null>(
      'notifications:markRead',
    ),
  },
};
