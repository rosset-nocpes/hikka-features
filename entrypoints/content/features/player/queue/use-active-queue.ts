import type { WatchRoom } from '@/utils/convex-api';

import { playQueued } from '../player';
import { useWatchTogether } from '../watch-together/use-watch-together';
import {
  type QueueEpisode,
  type QueueItem,
  queueKey,
  useQueue,
} from './use-queue';

/** The queue the player shows and plays from, whichever one it is. */
export interface ActiveQueue {
  /** The watch together room's, which every member edits and plays. */
  shared: boolean;
  items: QueueItem[];
  add: (items: QueueItem[]) => void;
  remove: (episode: QueueEpisode) => void;
  /** Adds the episode, or takes it off when it is queued already. */
  toggle: (item: QueueItem) => void;
  /** Puts a queued episode at `index`. */
  move: (episode: QueueEpisode, index: number) => void;
  clear: () => void;
  /** Plays a queued episode now; in a room, for everyone. */
  play: (item: QueueItem) => void;
}

const roomEpisode = ({ slug, episode }: QueueEpisode) => ({
  animeSlug: slug,
  episode,
});

const ownQueue = (items: QueueItem[]): ActiveQueue => {
  const { add, remove, toggle, move, clear } = useQueue.getState();
  return {
    shared: false,
    items,
    add,
    remove,
    toggle,
    move,
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
  const add = (added: QueueItem[]) =>
    editQueue({
      type: 'enqueue',
      items: added.map(({ slug, provider, team, episode }) => ({
        animeSlug: slug,
        provider,
        team,
        episode,
      })),
    });
  const remove = (episode: QueueEpisode) =>
    editQueue({ type: 'dequeue', items: [roomEpisode(episode)] });

  return {
    shared: true,
    items,
    add,
    remove,
    toggle: (item) =>
      items.some((queued) => queueKey(queued) === queueKey(item))
        ? remove(item)
        : add([item]),
    move: (episode, index) =>
      editQueue({ type: 'requeue', item: roomEpisode(episode), index }),
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
