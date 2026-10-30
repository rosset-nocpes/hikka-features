import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { create } from 'zustand';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';

import { Button } from '@/components/ui/button';

import type { QueueItem } from './use-queue';

import { type ActiveQueue, activeQueue } from './use-active-queue';

/** Long enough to notice and react; hovering or focusing it pauses it. */
const NOTICE_MS = 8_000;

interface Notice {
  id: number;
  text: string;
  /** Which queue it is about; it hides once the other one shows. */
  shared: boolean;
  /** Whether it offers to put back what was removed. */
  undoable: boolean;
}

/** What the shown undo puts back: removals in a row undo together. */
interface Removal {
  shared: boolean;
  /** The queue before the first of them. */
  before: QueueItem[];
  removed: QueueItem[];
}

export const useQueueNotice = create<{ notice?: Notice }>(() => ({}));

let removal: Removal | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let lastId = 0;

const pluralRules = new Intl.PluralRules('uk');
const EPISODES = { one: 'епізод', few: 'епізоди', many: 'епізодів' } as const;

export const episodeCount = (count: number) =>
  `${count} ${EPISODES[pluralRules.select(count) as keyof typeof EPISODES] ?? 'епізоду'}`;

const hideLater = () => {
  clearTimeout(timer);
  timer = setTimeout(dismissQueueNotice, NOTICE_MS);
};

const show = (notice: Omit<Notice, 'id'>) => {
  lastId += 1;
  useQueueNotice.setState({ notice: { ...notice, id: lastId } });
  hideLater();
};

export const dismissQueueNotice = () => {
  clearTimeout(timer);
  removal = undefined;
  useQueueNotice.setState({ notice: undefined });
};

/** Tells the user something about the queue they didn't do themselves. */
export const notifyQueue = (text: string, shared = false) => {
  removal = undefined;
  show({ text, shared, undoable: false });
};

/**
 * Offers to undo taking `removed` off `queue`, which holds them still: an
 * undo, unlike a confirmation, doesn't stand in the way. `text` says what
 * was done; after other removals, a count does unless it was a clear.
 */
export const offerUndo = (
  queue: ActiveQueue,
  removed: QueueItem[],
  text: string,
  cleared = false,
) => {
  if (!removed.length) return;
  const batch = removal?.shared === queue.shared ? removal : undefined;
  removal = {
    shared: queue.shared,
    before: batch?.before ?? queue.items,
    removed: [...(batch?.removed ?? []), ...removed],
  };
  const count = removal.removed.length;
  show({
    text: batch && !cleared ? `Прибрано ${episodeCount(count)}` : text,
    shared: queue.shared,
    undoable: true,
  });
};

const undo = () => {
  const queue = activeQueue();
  if (removal && removal.shared === queue.shared) {
    queue.restore(removal.before, removal.removed);
  }
  dismissQueueNotice();
};

/**
 * The queue's latest notice, at the bottom of its list, where it stays put
 * while the list scrolls.
 */
const QueueNotice = ({ shared }: { shared: boolean }) => {
  const notice = useQueueNotice((state) => state.notice);
  const shown = notice?.shared === shared ? notice : undefined;

  // The other queue showed meanwhile, e.g. on joining a room.
  useEffect(() => {
    if (notice && notice.shared !== shared) dismissQueueNotice();
  }, [notice, shared]);

  return (
    <div
      role="status"
      className="pointer-events-none sticky bottom-2 z-10 px-2"
    >
      <AnimatePresence initial={false}>
        {shown && (
          <motion.div
            key={shown.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onPointerEnter={() => clearTimeout(timer)}
            onPointerLeave={hideLater}
            onFocus={() => clearTimeout(timer)}
            onBlur={hideLater}
            className="bg-popover text-popover-foreground ring-foreground/10 pointer-events-auto flex items-center gap-1 rounded-lg p-1 pl-3 text-sm shadow-md ring-1"
          >
            <span className="min-w-0 flex-1 py-1 leading-tight text-pretty">
              {shown.text}
            </span>
            {shown.undoable && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary h-7"
                onClick={undo}
              >
                Скасувати
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label="Закрити"
              onClick={dismissQueueNotice}
            >
              <MaterialSymbolsCloseRounded />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QueueNotice;
