import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from 'convex/server';

import { convexApi } from './generated/convex-api';

/**
 * The backend's public functions, typed from its validators (see
 * `generated/convex-api.ts`, which `bun run api:generate` writes), and the
 * shapes the extension names. Nothing here restates a field.
 */
export { convexApi };

type Api = typeof convexApi;
type Reference = FunctionReference<'query' | 'mutation' | 'action'>;
type Returns<
  Name extends keyof Api,
  Fn extends keyof Api[Name],
> = Api[Name][Fn] extends Reference ? FunctionReturnType<Api[Name][Fn]> : never;
type Args<
  Name extends keyof Api,
  Fn extends keyof Api[Name],
> = Api[Name][Fn] extends Reference ? FunctionArgs<Api[Name][Fn]> : never;

/** An anime's teams with every provider's episodes, for the player. */
export type ConvexWatchResponse = Returns<'watch', 'resolve'>;
/**
 * A team in one translation, with every provider's copy of its episodes by
 * number. `key` names it whichever provider lists it (favorites, links and
 * rooms store it); `unnamed` marks a provider's uploads that credit no team,
 * named after the provider.
 */
export type ConvexWatchTeam = ConvexWatchResponse['teams'][number];
export type ConvexEpisodeInfo = ConvexWatchResponse['episodes'][number];
export type TranslationType = ConvexWatchTeam['translationType'];

/** A catalog team as lists of teams show it. */
export type CatalogTeam = Returns<'teams', 'list'>[number];
export type TeamPriority = NonNullable<Returns<'teamPriority', 'get'>>;
/** The version a user wants from their favorite teams. */
export type PreferredTranslation = TeamPriority['translationType'];

export type ReleaseNotificationMenu = Returns<'notifications', 'menu'>;
export type ReleaseNotification =
  ReleaseNotificationMenu['notifications'][number];

/**
 * A watch together room as its members see it: `position` is seconds into
 * the episode at `updatedAt`, a server time; `members` are in the order they
 * joined; `joinedElsewhere` says the user joined from another tab since.
 */
export type WatchRoom = NonNullable<Returns<'watchRooms', 'get'>>;
/** An episode of any anime in a room's queue, from the source it was added from. */
export type WatchRoomQueueItem = WatchRoom['queue'][number];
/** What a room plays: a provider's team's episode. */
export type WatchRoomSelection = Omit<WatchRoomQueueItem, 'animeSlug'>;
/** An anime's episode is queued once, whatever its source. */
export type WatchRoomQueueEpisode = Pick<
  WatchRoomQueueItem,
  'animeSlug' | 'episode'
>;
export type WatchRoomProfile = Omit<WatchRoom['members'][number], 'self'>;
export type WatchRoomAction = Args<'watchRooms', 'control'>['action'];
export type WatchRoomInbox = Returns<'watchRooms', 'inbox'>;
/** A room the user can join from their inbox. */
export type WatchRoomListing = WatchRoomInbox['rooms'][number];
export type WatchRoomFriend = Returns<'watchRooms', 'friends'>[number];

/**
 * What a friend is watching in the extension's player or reading in its
 * reader; a friend doing both is listed twice. `updatedAt` is the server
 * time of the last report; a chapter may be fractional, like 10.5; a room's
 * `code` is there when the user may join it.
 */
export type FriendActivity = Returns<'activity', 'friends'>[number];

/** The teams that dubbed or subtitled an anime, most trusted first. */
export type AnimeFandub = Returns<'fandub', 'forAnime'>;
export type TeamSummary = AnimeFandub['teams'][number]['team'];
/** What a team released of an anime in one translation. */
export type TeamRelease = AnimeFandub['teams'][number]['releases'][number];
export type ReleaseStatus = NonNullable<TeamRelease['status']>;

/**
 * A team's page: its profile and everything it released, newest first, with
 * when its latest release posts went up (`releaseTimes`, newest first).
 */
export type TeamPage = NonNullable<Returns<'fandub', 'team'>>;
export type TeamLinkKind = TeamPage['team']['links'][number]['kind'];
/** A team in the list of teams, with posters of its latest releases. */
export type TeamListing = Returns<'fandub', 'teams'>[number];
