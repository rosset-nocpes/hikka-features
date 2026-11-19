import { ConvexError } from 'convex/values';

import type {
  WatchRoom,
  WatchRoomAction,
  WatchRoomQueueEpisode,
  WatchRoomQueueItem,
  WatchRoomSelection,
} from '@/utils/convex-api';

/** Episodes a room's queue holds, as on the backend. */
const MAX_QUEUE = 100;

const ERROR_MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: 'Кімнату не знайдено',
  ROOM_CLOSED: 'Кімнату закрито',
  ROOM_FULL: 'Кімната заповнена',
  OTHER_ANIME: 'Кімнату створено для іншого аніме',
  OTHER_TAB: 'Кімната відкрита в іншій вкладці',
  UNAUTHENTICATED: 'Потрібен вхід через hikka.io',
  USER_NOT_FOUND: 'Потрібен вхід через hikka.io',
  EXTENSION_UPDATE_REQUIRED: 'Оновіть розширення, щоб дивитися разом',
  MEMBERS_OUTDATED:
    'Хтось у кімнаті має стару версію розширення, тож інше аніме не ввімкнеться',
  cancelled: 'Вхід скасовано',
  login_expired: 'Час на вхід минув',
  hikka_exchange_failed: 'hikka.io не підтвердила вхід',
  account_mismatch: 'Вхід був не за акаунтом, відкритим на hikka.io',
  hikka_unavailable: 'Не вдалося перевірити акаунт hikka.io',
};

export const errorMessage = (error: unknown) => {
  const code =
    error instanceof ConvexError
      ? (error.data as { code?: string } | undefined)?.code
      : error instanceof Error
        ? error.message
        : undefined;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return 'Не вдалося підключитися до кімнати';
};

/** What the player shows: an anime's episode from a source. */
export const selectionOf = ({
  slug,
  provider,
  team,
  currentEpisode,
}: {
  slug?: string;
  provider?: string;
  team?: API.TeamData;
  currentEpisode?: API.EpisodeData;
}): WatchRoomQueueItem | undefined =>
  slug && provider && currentEpisode
    ? {
        animeSlug: slug,
        provider,
        team: team?.key ?? '',
        episode: currentEpisode.episode,
      }
    : undefined;

/** Only the selection, as a room carries more fields than the API takes. */
export const pickSelection = ({
  provider,
  team,
  episode,
}: WatchRoomSelection) => ({
  provider,
  team,
  episode,
});

export const pickPlace = (place: WatchRoomQueueItem) => ({
  animeSlug: place.animeSlug,
  ...pickSelection(place),
});

export const sameSelection = (
  left: WatchRoomQueueItem,
  right: WatchRoomQueueItem,
) =>
  left.animeSlug === right.animeSlug &&
  left.provider === right.provider &&
  left.team === right.team &&
  left.episode === right.episode;

export const selectionKey = ({
  animeSlug,
  provider,
  team,
  episode,
}: WatchRoomQueueItem) => JSON.stringify([animeSlug, provider, team, episode]);

const queueKey = ({ animeSlug, episode }: WatchRoomQueueEpisode) =>
  `${animeSlug}:${episode}`;

export type RoomQueueEdit = Extract<
  WatchRoomAction,
  { type: 'enqueue' | 'dequeue' | 'requeue' }
>;

/** The queue after an edit, as the backend makes it. */
export const applyQueueEdit = (
  queue: WatchRoomQueueItem[],
  edit: RoomQueueEdit,
) => {
  const without = (episodes: WatchRoomQueueEpisode[]) => {
    const keys = new Set(episodes.map(queueKey));
    return queue.filter((item) => !keys.has(queueKey(item)));
  };
  switch (edit.type) {
    case 'enqueue': {
      const added = new Map(
        edit.items.map((item) => [queueKey(item), item] as const),
      );
      queue.forEach((item) => added.delete(queueKey(item)));
      return [...queue, ...added.values()].slice(0, MAX_QUEUE);
    }
    case 'dequeue':
      return without(edit.items);
    case 'requeue': {
      const item = queue.find(
        (queued) => queueKey(queued) === queueKey(edit.item),
      );
      if (!item) return queue;
      const rest = without([edit.item]);
      rest.splice(Math.max(edit.index, 0), 0, item);
      return rest;
    }
  }
};

/** Changes when the room's playback does, unlike when members come and go. */
export const playbackKey = (room: WatchRoom) =>
  JSON.stringify([
    selectionKey(room),
    room.playing,
    room.position,
    room.rate,
    room.updatedAt,
  ]);

/** A time or rate the player reported, 0 when it is unusable. */
export const finite = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : 0;

export const nearest = (options: number[], value: number) =>
  options.reduce((best, option) =>
    Math.abs(option - value) < Math.abs(best - value) ? option : best,
  );
