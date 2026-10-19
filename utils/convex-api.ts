import { makeFunctionReference } from 'convex/server';

import type { CompatibilityResponse } from '@/utils/compatibility';

// Hand-written mirror of the backend contract (features-backend/convex).

type TranslationType = 'dub' | 'sub' | 'unknown';
export type PreferredTranslation = 'dub' | 'sub';

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

export interface CatalogTeam {
  id: string;
  title: string;
  logo?: string;
}

export interface TeamPriority {
  teams: CatalogTeam[];
  translationType: PreferredTranslation;
  updatedAt: number;
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
  /** Missing from backends deployed before it was added. */
  translationType?: TranslationType;
  episodeNumber: number;
  episodeTitle?: string;
  createdAt: number;
  seen: boolean;
}

export interface ReleaseNotificationMenu {
  notifications: ReleaseNotification[];
  unseenCount: number;
}

// A type rather than an interface, so it fits Convex's argument constraint.
export type WatchRoomSelection = {
  provider: string;
  /** Team key in the watch data; empty for providers without teams. */
  team: string;
  episode: number;
};

export interface WatchRoomProfile {
  id: string;
  username?: string;
  avatar?: string;
}

export interface WatchRoomMember extends WatchRoomProfile {
  self: boolean;
}

export interface WatchRoom extends WatchRoomSelection {
  code: string;
  animeSlug: string;
  playing: boolean;
  /** Seconds into the episode at `updatedAt`, a server timestamp. */
  position: number;
  rate: number;
  updatedAt: number;
  updatedBy: string;
  ownerId: string;
  /** The owner's friends see the room and join without the code. */
  friendsCanJoin: boolean;
  /** In the order they joined. */
  members: WatchRoomMember[];
  /** The user joined from another tab since this one. */
  joinedElsewhere: boolean;
}

/** A room the user can join from their inbox. */
export interface WatchRoomListing {
  code: string;
  animeSlug: string;
  animeTitle?: string;
  episode: number;
  memberCount: number;
  /** Who sent the invite, or the friend who owns the room. */
  friend: WatchRoomProfile;
}

export interface WatchRoomInbox {
  invites: Array<WatchRoomListing & { id: string }>;
  rooms: WatchRoomListing[];
}

export interface WatchRoomFriend extends WatchRoomProfile {
  status: 'member' | 'invited' | 'none';
}

export type WatchRoomAction =
  | { type: 'play' | 'pause' | 'seek'; position: number }
  | { type: 'rate'; position: number; rate: number }
  | {
      type: 'select';
      from: WatchRoomSelection;
      to: WatchRoomSelection;
      /** Replaces a room speed the new source's players don't offer. */
      rate?: number;
    };

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
  teams: {
    list: makeFunctionReference<'query', NoArgs, CatalogTeam[]>('teams:list'),
  },
  teamPriority: {
    get: makeFunctionReference<'query', NoArgs, TeamPriority | null>(
      'teamPriority:get',
    ),
    set: makeFunctionReference<
      'mutation',
      { teamIds: string[]; translationType: PreferredTranslation },
      TeamPriority
    >('teamPriority:set'),
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
  watchRooms: {
    create: makeFunctionReference<
      'mutation',
      WatchRoomSelection & {
        animeSlug: string;
        playing: boolean;
        position: number;
        rate: number;
        tab: string;
      },
      { code: string }
    >('watchRooms:create'),
    get: makeFunctionReference<
      'query',
      { code: string; tab: string },
      WatchRoom | null
    >('watchRooms:get'),
    heartbeat: makeFunctionReference<
      'mutation',
      {
        code: string;
        /** The tab the user is in; the one they joined from last counts. */
        tab: string;
        /** Sent with the first beat, which joins the room. */
        join?: { animeSlug: string };
      },
      { now: number } | null
    >('watchRooms:heartbeat'),
    control: makeFunctionReference<
      'mutation',
      { code: string; action: WatchRoomAction; tab: string },
      null
    >('watchRooms:control'),
    leave: makeFunctionReference<
      'mutation',
      { code: string; tab: string },
      null
    >('watchRooms:leave'),
    share: makeFunctionReference<
      'mutation',
      { code: string; friendsCanJoin: boolean },
      null
    >('watchRooms:share'),
    friends: makeFunctionReference<
      'query',
      { code: string },
      WatchRoomFriend[]
    >('watchRooms:friends'),
    invite: makeFunctionReference<
      'mutation',
      { code: string; userId: string },
      null
    >('watchRooms:invite'),
    decline: makeFunctionReference<'mutation', { id: string }, null>(
      'watchRooms:decline',
    ),
    inbox: makeFunctionReference<'query', NoArgs, WatchRoomInbox>(
      'watchRooms:inbox',
    ),
  },
  friends: {
    refresh: makeFunctionReference<'action', NoArgs, null>('friends:refresh'),
  },
};
