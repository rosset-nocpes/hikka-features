import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants/storage';
import { extensionStorage, followStoredChanges } from '@/hooks/use-settings';

import {
  distinct,
  insertedInOrder,
  type QueueEpisode,
  type QueueItem,
  queuedFirst,
  queueKey,
  restoredOrder,
  without,
} from './queue-order';

export {
  insertedInOrder,
  type QueueEpisode,
  type QueueItem,
  queueKey,
  restoredOrder,
} from './queue-order';

/** What can be done to a queue: the user's own, or a watch together room's. */
export interface QueueActions {
  /** Adds episodes at the end, or with `next` first, moving queued ones up. */
  add: (items: QueueItem[], next?: boolean) => void;
  /** Adds episodes among their anime's queued ones, in order. */
  insert: (items: QueueItem[]) => void;
  remove: (episodes: QueueEpisode | QueueEpisode[]) => void;
  /** Inserts the episode, or takes it off when it is queued already. */
  toggle: (item: QueueItem) => void;
  /** Puts a queued episode at `index`. */
  move: (episode: QueueEpisode, index: number) => void;
  /** Puts `removed` back where they were in `before`. */
  restore: (before: QueueItem[], removed: QueueItem[]) => void;
  clear: () => void;
}

interface QueueState extends QueueActions {
  items: QueueItem[];
  /** The episode a click asked to play, while its anime loads. */
  loading?: string;
}

/** The player's queue, kept in the extension's storage across tabs. */
export const useQueue = create<QueueState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (items, next) => {
        const queue = get().items;
        if (next) {
          set({ items: queuedFirst(queue, items) });
          return;
        }
        set({ items: distinct([...queue, ...items]) });
      },
      insert: (items) => set({ items: insertedInOrder(get().items, items) }),
      remove: (episodes) => {
        const items = without(get().items, [episodes].flat());
        if (items.length !== get().items.length) set({ items });
      },
      toggle: (item) => {
        const queue = get().items;
        const items = without(queue, [item]);
        set({
          items:
            items.length === queue.length
              ? insertedInOrder(queue, [item])
              : items,
        });
      },
      move: (episode, index) => {
        const items = without(get().items, [episode]);
        const item = get().items.find(
          (queued) => queueKey(queued) === queueKey(episode),
        );
        if (item) items.splice(index, 0, item);
        set({ items });
      },
      restore: (before, removed) =>
        set({ items: restoredOrder(before, get().items, removed) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: STORAGE_KEYS.playerQueue,
      storage: createJSONStorage(() => extensionStorage),
      partialize: ({ items }) => ({ items }),
    },
  ),
);

followStoredChanges(useQueue, STORAGE_KEYS.playerQueue);
