import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { extensionStorage } from '@/hooks/use-settings';

/** An episode to play after the current one, of any anime. */
export interface QueueItem {
  slug: string;
  episode: number;
  /** The source it was queued from, tried first when it plays. */
  provider: string;
  /** The team's key in the watch data; empty for providers without teams. */
  team: string;
}

export type QueueEpisode = Pick<QueueItem, 'slug' | 'episode'>;

/** An anime's episode is queued once, whatever its source. */
export const queueKey = ({ slug, episode }: QueueEpisode) =>
  `${slug}:${episode}`;

const without = (items: QueueItem[], episodes: QueueEpisode[]) => {
  const keys = new Set(episodes.map(queueKey));
  return items.filter((item) => !keys.has(queueKey(item)));
};

/** The episodes once each, the first time they appear. */
const distinct = (items: QueueItem[]) => [
  ...new Map(items.map((item) => [queueKey(item), item] as const)).values(),
];

/** `items` put first, moving those queued already up. */
export const queuedFirst = (queue: QueueItem[], items: QueueItem[]) => [
  ...distinct(items),
  ...without(queue, items),
];

/**
 * `queue` with `removed` back where they were in `before`: each right after
 * the closest episode before it that is still queued. Episodes added or
 * moved since keep their place.
 */
export const restoredOrder = (
  before: QueueItem[],
  queue: QueueItem[],
  removed: QueueItem[],
) => {
  const restoring = new Set(removed.map(queueKey));
  const result = without(queue, removed);
  // In their old order, so each finds the ones restored before it.
  for (const [index, item] of before.entries()) {
    if (!restoring.has(queueKey(item))) continue;
    let at = 0;
    for (let earlier = index - 1; earlier >= 0; earlier -= 1) {
      const key = queueKey(before[earlier]!);
      const position = result.findIndex((queued) => queueKey(queued) === key);
      if (position !== -1) {
        at = position + 1;
        break;
      }
    }
    result.splice(at, 0, item);
  }
  return result;
};

interface QueueState {
  items: QueueItem[];
  /** The episode a click asked to play, while its anime loads. */
  loading?: string;
  /** Adds episodes at the end, or with `next` first, moving queued ones up. */
  add: (items: QueueItem[], next?: boolean) => void;
  remove: (episode: QueueEpisode) => void;
  /** Adds the episode, or takes it off when it is queued already. */
  toggle: (item: QueueItem) => void;
  /** Puts a queued episode at `index`. */
  move: (episode: QueueEpisode, index: number) => void;
  /** Puts `removed` back where they were in `before`. */
  restore: (before: QueueItem[], removed: QueueItem[]) => void;
  clear: () => void;
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
      remove: (episode) => {
        const items = without(get().items, [episode]);
        if (items.length !== get().items.length) set({ items });
      },
      toggle: (item) => {
        const items = without(get().items, [item]);
        set({
          items: items.length === get().items.length ? [...items, item] : items,
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
      name: 'player-queue',
      storage: createJSONStorage(() => extensionStorage),
      partialize: ({ items }) => ({ items }),
    },
  ),
);

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes['player-queue']) {
    void useQueue.persist.rehydrate();
  }
});
