import type { WatchRoom } from '@/utils/convex-api';

import { playQueued } from '../player';
import { MAX_ROOM_QUEUE } from '../player.constants';
import { useWatchTogether } from '../watch-together/use-watch-together';
import { roomInsertion } from './queue-order';
import {
  type QueueActions,
  type QueueEpisode,
  type QueueItem,
  queueKey,
  restoredOrder,
  useQueue,
} from './use-queue';

/** The queue the player shows and plays from, whichever one it is. */
export interface ActiveQueue extends QueueActions {
  /** The watch together room's, which every member edits and plays. */
  shared: boolean;
  items: QueueItem[];
  /** Plays a queued episode now; in a room, for everyone. */
  play: (item: QueueItem) => void;
}

const roomEpisode = ({ slug, episode }: QueueEpisode) => ({
  animeSlug: slug,
  episode,
});

const roomItem = ({ slug, provider, team, episode }: QueueItem) => ({
  animeSlug: slug,
  provider,
  team,
  episode,
});

const ownQueue = (items: QueueItem[]): ActiveQueue => {
  const { add, insert, remove, toggle, move, restore, clear } =
    useQueue.getState();
  return {
    shared: false,
    items,
    add,
    insert,
    remove,
    toggle,
    move,
    restore,
    clear,
    play: (item) => void playQueued(item),
  };
};

const roomQueue = (room: WatchRoom): ActiveQueue => {
  const { editQueue, advance } = useWatchTogether.getState();
  const items = room.queue.map(({ animeSlug, provider, team, episode }) => ({
    slug: animeSlug,
    provider,
    team,
    episode,
  }));
  const enqueue = (added: QueueItem[]) =>
    editQueue({ type: 'enqueue', items: added.map(roomItem) });
  const move = (episode: QueueEpisode, index: number) =>
    editQueue({ type: 'requeue', item: roomEpisode(episode), index });
  const remove = (episodes: QueueEpisode | QueueEpisode[]) =>
    editQueue({ type: 'dequeue', items: [episodes].flat().map(roomEpisode) });
  // The room appends what it is sent; the moves, in order, then place it.
  // Each lands where it belongs since all before it are placed already.
  const place = (placed: { item: QueueItem; index: number }[]) =>
    placed
      .toSorted((a, b) => a.index - b.index)
      .forEach(({ item, index }) => move(item, index));
  const insert = (added: QueueItem[]) => {
    const { fresh, moves } = roomInsertion(items, added, MAX_ROOM_QUEUE);
    if (!fresh.length) return;
    enqueue(fresh);
    place(moves);
  };

  return {
    shared: true,
    items,
    add: (added, next) => {
      enqueue(added);
      if (next) place(added.map((item, index) => ({ item, index })));
    },
    insert,
    remove,
    toggle: (item) =>
      items.some((queued) => queueKey(queued) === queueKey(item))
        ? remove(item)
        : insert([item]),
    move,
    restore: (before, removed) => {
      const order = restoredOrder(before, items, removed).map(queueKey);
      enqueue(removed);
      place(
        removed.map((item) => ({ item, index: order.indexOf(queueKey(item)) })),
      );
    },
    // Only what the user sees; an episode someone adds meanwhile stays.
    clear: () => editQueue({ type: 'dequeue', items: items.map(roomEpisode) }),
    play: (item) => advance(roomEpisode(item)),
  };
};

/** The watch together room's queue while in one, else the user's own. */
export const activeQueue = () => {
  const { room } = useWatchTogether.getState();
  return room ? roomQueue(room) : ownQueue(useQueue.getState().items);
};

export const useActiveQueue = () => {
  const room = useWatchTogether((state) => state.room);
  const items = useQueue((state) => state.items);
  return room ? roomQueue(room) : ownQueue(items);
};
