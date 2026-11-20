import { AnimatePresence, motion } from 'motion/react';
import MaterialSymbolsFastForwardRounded from '~icons/material-symbols/fast-forward-rounded';

import type { SkipSegment as Segment } from '@/utils/convex-api';

import { Button } from '@/components/ui/button';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { compactMode, usePlayer } from '../context/player-context';
import { useSkipSegments } from './use-skip-segments';

/** While the controls are hidden, the button still shows this long. */
const SHOWN_ALONE_S = 8;

const LABELS: Record<Segment['type'], string> = {
  opening: 'Пропустити опенінг',
  ending: 'Пропустити ендінг',
};

/** The segment playing now, until its last second. */
const segmentAt = (segments: Segment[], time: number) =>
  segments.find(({ start, end }) => time >= start && time < end - 1);

/**
 * Offers to skip the opening or ending that's playing, never skipping by
 * itself: it shows as one starts and with the controls after that.
 */
const SkipSegment = () => {
  const segments = useSkipSegments();
  const segment = useIFramePlayer((state) =>
    segmentAt(segments, state.currentTime),
  );
  const shown = useIFramePlayer(
    (state) =>
      !!segment &&
      (state.uiShown || state.currentTime < segment.start + SHOWN_ALONE_S),
  );
  const isCompact = usePlayer(compactMode);

  const skip = () => {
    if (!segment) return;
    const { duration, seek } = useIFramePlayer.getState();
    seek(duration > 0 ? Math.min(segment.end, duration) : segment.end);
  };

  return (
    <div
      className={cn(
        'pointer-events-none relative flex justify-end',
        isCompact ? 'px-2 pb-1' : 'px-3 pb-2 md:px-2',
      )}
    >
      <AnimatePresence>
        {shown && segment && (
          <motion.div
            key={segment.start}
            // Holding it mustn't speed the video up.
            data-player-controls
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="pointer-events-auto"
          >
            <Button
              variant="secondary"
              size={isCompact ? 'sm' : 'md'}
              className="player-glass gap-1.5 border shadow-lg"
              onClick={skip}
            >
              <MaterialSymbolsFastForwardRounded className="size-5" />
              {LABELS[segment.type]}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkipSegment;
