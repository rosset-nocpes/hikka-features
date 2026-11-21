import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import MaterialSymbolsFastForwardRounded from '~icons/material-symbols/fast-forward-rounded';

import type { Recap } from '@/integrations/iframe-player/moon';
import type { SkipSegment as Found } from '@/utils/convex-api';

import { Button } from '@/components/ui/button';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { compactMode, usePlayer } from '../context/player-context';
import { useSkipSegments } from './use-skip-segments';

/** While the controls are hidden, the button still shows this long. */
const SHOWN_ALONE_S = 8;
/** The fade's length, as the controls' (`duration-300`). */
const FADE_MS = 300;
/** Between above the controls and the bottom edge, while it shows. */
const SLIDE = { duration: 0.3, ease: 'easeOut' } as const;

type Segment = Found | (Recap & { type: 'recap' });

const LABELS: Record<Segment['type'], string> = {
  opening: 'Пропустити опенінг',
  ending: 'Пропустити ендінг',
  recap: 'Пропустити рекап',
};

/** The segment playing now, until its last second. */
const segmentAt = (segments: Segment[], time: number) =>
  segments.find(({ start, end }) => time >= start && time < end - 1);

/**
 * Offers to skip the opening, ending or recap that's playing, never
 * skipping by itself: it shows as one starts and with the controls after
 * that. Openings and endings come from the backend, recaps from the player.
 *
 * It lies over the controls' box (see `PlayerOverlay`): just above them
 * while they show, and down at the video's bottom edge while it shows
 * without them, rather than floating where they were. It moves only while
 * it shows: one appearing is in place at once (and stays put until it has
 * faded in), and one fading out stays where it is, even mid-slide.
 */
const SkipSegment = () => {
  const found = useSkipSegments();
  const recaps = useIFramePlayer((state) => state.recaps);
  const segments: Segment[] = [
    ...found,
    ...recaps.map((recap) => ({ ...recap, type: 'recap' as const })),
  ];
  const segment = useIFramePlayer((state) =>
    segmentAt(segments, state.currentTime),
  );
  const shown = useIFramePlayer(
    (state) =>
      !!segment &&
      (state.uiShown || state.currentTime < segment.start + SHOWN_ALONE_S),
  );
  const uiShown = useIFramePlayer((state) => state.uiShown);
  const isCompact = usePlayer(compactMode);
  const reduceMotion = useReducedMotion();

  // What it offers: the segment playing while it shows; fading out, it
  // keeps the last one's label (and width).
  const [offered, setOffered] = useState(segment);
  if (
    shown &&
    segment &&
    (segment.type !== offered?.type ||
      segment.start !== offered.start ||
      segment.end !== offered.end)
  ) {
    setOffered(segment);
  }

  // From the top of the controls' box: above them, or at the bottom edge.
  const target = uiShown ? '0%' : '100%';
  const top = useMotionValue(target);
  // Below the controls (their seek tooltip goes over it) once above them;
  // over them, clickable, anywhere else.
  const zIndex = useTransform(top, (value) =>
    Number.parseFloat(value) === 0 ? 'auto' : 10,
  );
  /**
   * It has faded in: from then on it slides to where it belongs. Showing
   * from the start (no fade to wait for), it already has.
   */
  const [settled, setSettled] = useState(shown);
  const [wasShown, setWasShown] = useState(shown);
  if (shown !== wasShown) {
    setWasShown(shown);
    if (!shown) setSettled(false);
  }
  /** Whether it shows, as last committed. */
  const visible = useRef(shown);
  /** The faded element, to tell a fresh appearance from a reversed fade. */
  const faded = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const appearing = shown && !visible.current;
    visible.current = shown;
    // Fading out: it stays where it was last painted (stopping alone would
    // step a running slide on to this frame's time first).
    if (!shown) {
      const painted = top.get();
      top.stop();
      top.jump(painted);
      return;
    }
    // Appearing from nothing: in place at once, before it's painted. A
    // fade-out reversed before it finished carries on from where it is.
    // Its opacity now is where its fade starts from.
    if (
      appearing &&
      faded.current &&
      Number(getComputedStyle(faded.current).opacity) === 0
    ) {
      top.jump(target);
    }
    // Faded in (by its time, whether or not a transition ran): it slides
    // from then on.
    if (!settled) {
      const settle = setTimeout(() => setSettled(true), FADE_MS);
      return () => clearTimeout(settle);
    }
    if (reduceMotion) {
      top.jump(target);
      return;
    }
    const sliding = animate(top, target, SLIDE);
    return () => {
      // Stopping steps a slide on to this frame's time; it stays where it
      // was painted (a fade-out or a new slide starts from there).
      const painted = top.get();
      sliding.stop();
      top.jump(painted);
    };
  }, [shown, settled, target, top, reduceMotion]);

  // The segment it offers, while it shows: fading out, it does nothing.
  const skip = () => {
    if (!shown || !segment) return;
    const { duration, seek } = useIFramePlayer.getState();
    seek(duration > 0 ? Math.min(segment.end, duration) : segment.end);
  };

  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex }}
    >
      {/* Always there, so it fades in and out as the controls do: by the
          same CSS transition, which a reversal mid-fade shortens alike. */}
      <motion.div
        ref={faded}
        // Holding it mustn't speed the video up.
        data-player-controls
        style={{ top }}
        className={cn(
          'absolute -translate-y-full transition-opacity duration-300',
          shown ? 'opacity-100' : 'opacity-0',
          isCompact ? 'right-2 pb-1' : 'right-3 pb-2 md:right-2',
        )}
      >
        {offered && (
          <Button
            variant="secondary"
            size={isCompact ? 'sm' : 'md'}
            // Fading out or gone, taps go through to the controls under it.
            className={cn(
              'player-glass gap-1.5 border shadow-lg',
              shown ? 'pointer-events-auto' : 'pointer-events-none',
            )}
            inert={!shown}
            tabIndex={shown ? undefined : -1}
            onClick={skip}
          >
            <MaterialSymbolsFastForwardRounded className="size-5" />
            {LABELS[offered.type]}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SkipSegment;
