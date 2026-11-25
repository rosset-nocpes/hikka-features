/** An episode to play after the current one, of any anime. */
export interface QueueItem {
  slug: string;
  episode: number;
  /** The source it was queued from, tried first when it plays. */
  provider: string;
  /** The team's key in the watch data. */
  team: string;
}

export type QueueEpisode = Pick<QueueItem, 'slug' | 'episode'>;

/** An anime's episode is queued once, whatever its source. */
export const queueKey = ({ slug, episode }: QueueEpisode) =>
  `${slug}:${episode}`;

export const without = (items: QueueItem[], episodes: QueueEpisode[]) => {
  const keys = new Set(episodes.map(queueKey));
  return items.filter((item) => !keys.has(queueKey(item)));
};

/** The episodes once each, the first time they appear. */
export const distinct = (items: QueueItem[]) => [
  ...new Map(items.map((item) => [queueKey(item), item] as const)).values(),
];

/** `items` put first, moving those queued already up. */
export const queuedFirst = (queue: QueueItem[], items: QueueItem[]) => [
  ...distinct(items),
  ...without(queue, items),
];

/**
 * `queue` with `items` added in their anime's order: each right before the
 * first later episode of its anime queued already, else at the end. Ticking
 * episodes in any order, or a range around queued ones, still plays them in
 * order. Queued ones stay where they are.
 */
export const insertedInOrder = (queue: QueueItem[], items: QueueItem[]) => {
  const result = [...queue];
  const keys = new Set(queue.map(queueKey));
  for (const item of items) {
    const key = queueKey(item);
    if (keys.has(key)) continue;
    keys.add(key);
    const at = result.findIndex(
      (queued) => queued.slug === item.slug && queued.episode > item.episode,
    );
    if (at === -1) result.push(item);
    else result.splice(at, 0, item);
  }
  return result;
};

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

/**
 * How a watch together room's queue takes `added` in their anime's order:
 * the room appends what it is sent, up to `max`, and the moves, made in
 * order, then place each. Episodes that land at the end once appended, as
 * later ones mostly do, need no move, so a room isn't sent one per episode.
 */
export const roomInsertion = (
  queue: QueueItem[],
  added: QueueItem[],
  max: number,
) => {
  const queued = new Set(queue.map(queueKey));
  const fresh = distinct(added)
    .filter((item) => !queued.has(queueKey(item)))
    .slice(0, Math.max(0, max - queue.length));
  const order = insertedInOrder(queue, fresh);
  // The end of the order that is the end of what is appended, as appended.
  let last = fresh.length - 1;
  for (let at = order.length - 1; last >= 0 && order[at] === fresh[last];) {
    at -= 1;
    last -= 1;
  }
  const moves = fresh
    .slice(0, last + 1)
    .map((item) => ({ item, index: order.indexOf(item) }))
    .toSorted((a, b) => a.index - b.index);
  return { fresh, moves };
};
