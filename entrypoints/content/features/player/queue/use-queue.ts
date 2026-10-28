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

interface QueueState {
  items: QueueItem[];
  add: (items: QueueItem[]) => void;
  remove: (episode: QueueEpisode) => void;
  /** Adds the episode, or takes it off when it is queued already. */
  toggle: (item: QueueItem) => void;
  /** Puts a queued episode at `index`. */
  move: (episode: QueueEpisode, index: number) => void;
  clear: () => void;
}

const without = (items: QueueItem[], episode: QueueEpisode) =>
  items.filter((item) => queueKey(item) !== queueKey(episode));

/** The player's queue, kept in the extension's storage across tabs. */
export const useQueue = create<QueueState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (items) => {
        const queued = new Set(get().items.map(queueKey));
        set({
          items: [
            ...get().items,
            ...items.filter((item) => !queued.has(queueKey(item))),
          ],
        });
      },
      remove: (episode) => {
        const items = without(get().items, episode);
        if (items.length !== get().items.length) set({ items });
      },
      toggle: (item) => {
        const items = without(get().items, item);
        set({
          items: items.length === get().items.length ? [...items, item] : items,
        });
      },
      move: (episode, index) => {
        const items = without(get().items, episode);
        const item = get().items.find(
          (queued) => queueKey(queued) === queueKey(episode),
        );
        if (item) items.splice(index, 0, item);
        set({ items });
      },
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
