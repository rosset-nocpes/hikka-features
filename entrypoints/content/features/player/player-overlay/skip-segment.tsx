import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import MaterialSymbolsFastForwardRounded from '~icons/material-symbols/fast-forward-rounded';

import type { Recap } from '@/integrations/iframe-player/moon';
import type { SkipSegment as Found } from '@/utils/convex-api';

import { Button } from '@/components/ui/button';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { compactMode, usePlayer } from '../context/player-context';
import {
  AUTO_SKIP_HIDE_MS,
  SKIP_SHOWN_ALONE_S,
  SKIP_FADE_MS,
} from '../player.constants';
import { useWatchTogether } from '../watch-together/use-watch-together';
import { useSkipSegments } from './use-skip-segments';

/** Between above the controls and the bottom edge, while it shows. */
const SLIDE = { duration: 0.3, ease: 'easeOut' } as const;

type Segment = Found | (Recap & { type: 'recap' });

const LABELS: Record<Segment['type'], string> = {
  opening: 'Пропустити опенінг',
  ending: 'Пропустити ендінг',
  recap: 'Пропустити рекап',
};

interface AutoSkip {
  key: string;
  start: number;
  end: number;
}

/** Whether the player, as it is now, still plays `segment`. */
const stillIn = ({ start, end }: AutoSkip) => {
  const { isReady, isPlaying, adInProgress, currentTime } =
    useIFramePlayer.getState();
  return (
    isReady &&
    isPlaying &&
    !adInProgress &&
    currentTime >= start &&
    currentTime < end - 1
  );
};

/** The segment playing now, until its last second. */
const segmentAt = (segments: Segment[], time: number) =>
  segments.find(({ start, end }) => time >= start && time < end - 1);

/**
 * Offers to skip the opening, ending or recap that's playing, as the
 * `skipSegments` setting says: not at all (nor are they looked up), with a
 * button, or by itself as one starts. Each is skipped by itself once, so
 * seeking back into it plays it, with the button there to skip it again.
 */
const SkipSegment = () => {
  const mode = useSettings((state) => state.features.player.skipSegments);
  return mode === 'off' ? null : <SkipSegmentButton auto={mode === 'auto'} />;
};

/**
 * The button shows as a segment starts and with the controls after that.
 * Openings and endings come from the backend, recaps from the player.
 *
 * It lies over the controls' box (see `PlayerOverlay`): just above them
 * while they show, and down at the video's bottom edge while it shows
 * without them, rather than floating where they were. It moves only while
 * it shows: one appearing is in place at once (and stays put until it has
 * faded in), and one fading out stays where it is, even mid-slide.
 */
const SkipSegmentButton = ({ auto }: { auto: boolean }) => {
  const found = useSkipSegments();
  const recaps = useIFramePlayer((state) => state.recaps);
  const segments: Segment[] = [
    ...found,
    ...recaps.map((recap) => ({ ...recap, type: 'recap' as const })),
  ];
  const segment = useIFramePlayer((state) =>
    segmentAt(segments, state.currentTime),
  );

  /*
   * With `auto`, each segment of the episode is skipped once, while it
   * plays, past any ad. Not in a room: the seek would move every member,
   * whatever they chose, so there it is the button's.
   */
  const slug = usePlayer((state) => state.slug);
  const episode = usePlayer((state) => state.currentEpisode?.episode);
  const inRoom = useWatchTogether((state) => !!state.room);
  const playing = useIFramePlayer(
    (state) => state.isReady && state.isPlaying && !state.adInProgress,
  );
  const segmentKey =
    segment &&
    JSON.stringify([slug, episode, segment.type, segment.start, segment.end]);
  const [autoSkipped, setAutoSkipped] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  /** The segment being skipped by itself, its button hidden meanwhile. */
  const [autoSkip, setAutoSkip] = useState<AutoSkip>();
  if (
    auto &&
    !inRoom &&
    playing &&
    segment &&
    segmentKey &&
    !autoSkipped.has(segmentKey)
  ) {
    setAutoSkipped(new Set(autoSkipped).add(segmentKey));
    setAutoSkip({ key: segmentKey, start: segment.start, end: segment.end });
  } else if (autoSkip && autoSkip.key !== segmentKey) {
    setAutoSkip(undefined);
  }

  const shown =
    useIFramePlayer(
      (state) =>
        !!segment &&
        (state.uiShown ||
          state.currentTime < segment.start + SKIP_SHOWN_ALONE_S),
    ) && autoSkip?.key !== segmentKey;
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
      const settle = setTimeout(() => setSettled(true), SKIP_FADE_MS);
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

  const seekPast = ({ end }: { end: number }) => {
    const { duration, seek } = useIFramePlayer.getState();
    seek(duration > 0 ? Math.min(end, duration) : end);
  };

  // The segment it offers, while it shows: fading out, it does nothing.
  const skip = () => {
    if (shown && segment) seekPast(segment);
  };

  const forget = ({ key }: AutoSkip) => {
    setAutoSkipped((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    setAutoSkip((current) => (current?.key === key ? undefined : current));
  };

  useEffect(() => {
    if (!autoSkip) return;
    let ran = false;
    // After every effect of this render: a new episode's reset among them,
    // which this render's (stale) time came before. Not a frame: hidden
    // tabs (picture-in-picture) have none, yet keep playing.
    const check = setTimeout(() => {
      ran = true;
      if (stillIn(autoSkip)) return seekPast(autoSkip);
      // Not skipped after all: it may be, once the player is really in it.
      forget(autoSkip);
    }, 0);
    const timeout = setTimeout(() => setAutoSkip(undefined), AUTO_SKIP_HIDE_MS);
    return () => {
      clearTimeout(check);
      clearTimeout(timeout);
      if (!ran) forget(autoSkip);
    };
  }, [autoSkip]);

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
