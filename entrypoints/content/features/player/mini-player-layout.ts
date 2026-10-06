import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import { type MiniPlayerCorner, usePlayer } from './context/player-context';

/** `bar` is the strip shown while the browser's picture-in-picture plays. */
export type PlayerLayout = 'full' | 'mini' | 'bar';

/** Gap to the viewport edges; top corners also clear hikka's header. */
const MARGIN = 16;
const HEADER_HEIGHT = 64;
/** Movement before a press on a handle turns into a drag. */
const DRAG_THRESHOLD = 4;
/** How far ahead a release is projected, so a flick goes where it's thrown. */
const FLING_MS = 150;
const VELOCITY_WINDOW_MS = 80;
const DURATION_MS = 320;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface Point {
  x: number;
  y: number;
}

const layoutOf = (state: {
  miniPlayer: boolean;
  videoPiPActive: boolean;
}): PlayerLayout =>
  state.miniPlayer ? 'mini' : state.videoPiPActive ? 'bar' : 'full';

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Where the card's top-left corner may go: the viewport minus scrollbars and margins. */
const bounds = (width: number, height: number) => {
  const { clientWidth, clientHeight } = document.documentElement;
  // Narrow screens get thinner margins rather than a cut-off player.
  const marginX = Math.max(0, Math.min(MARGIN, (clientWidth - width) / 2));
  const marginY = Math.max(0, Math.min(MARGIN, (clientHeight - height) / 2));
  return {
    minX: marginX,
    maxX: clientWidth - width - marginX,
    minY: marginY,
    maxY: clientHeight - height - marginY,
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

const cornerPoint = (
  corner: MiniPlayerCorner,
  width: number,
  height: number,
): Point => {
  const { minX, maxX, minY, maxY } = bounds(width, height);
  return {
    x: corner.endsWith('left') ? minX : maxX,
    y: corner.startsWith('top') ? Math.min(minY + HEADER_HEIGHT, maxY) : maxY,
  };
};

const nearestCorner = (
  point: Point,
  width: number,
  height: number,
): MiniPlayerCorner => {
  const { clientWidth, clientHeight } = document.documentElement;
  const vertical = point.y + height / 2 < clientHeight / 2 ? 'top' : 'bottom';
  const horizontal = point.x + width / 2 < clientWidth / 2 ? 'left' : 'right';
  return `${vertical}-${horizontal}`;
};

/**
 * Keeps the floating player in its corner and lets it be dragged to another.
 * The position is the card's CSS `translate`, written directly, so dragging
 * never re-renders the player. Returns the `pointerdown` handler for handles.
 */
export const useMiniPlayerDrag = (
  cardRef: RefObject<HTMLElement | null>,
  layout: PlayerLayout,
) => {
  const floating = layout !== 'full';
  const position = useRef<Point>({ x: 0, y: 0 });

  const place = useCallback(
    (point: Point, animate = false) => {
      const card = cardRef.current;
      if (!card) return;
      position.current = point;
      card.style.transition =
        animate && !reducedMotion() ? `translate ${DURATION_MS}ms ${EASE}` : '';
      card.style.translate = `${point.x}px ${point.y}px`;
    },
    [cardRef],
  );

  const placeInCorner = useCallback(
    (animate = false) => {
      const card = cardRef.current;
      if (!card) return;
      const { miniPlayerCorner } = usePlayer.getState();
      place(
        cornerPoint(miniPlayerCorner, card.offsetWidth, card.offsetHeight),
        animate,
      );
    },
    [cardRef, place],
  );

  // Before paint, so a new mini player never shows up at the viewport origin.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!floating) {
      card.style.translate = '';
      card.style.transition = '';
      return;
    }

    placeInCorner();
    const handleResize = () => placeInCorner();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cardRef, floating, layout, placeInCorner]);

  return useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const card = cardRef.current;
      if (!floating || !card || event.button !== 0) return;
      event.preventDefault();

      // Capture keeps the moves coming while the pointer is over the iframe.
      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);

      const { offsetWidth: width, offsetHeight: height } = card;
      const { minX, maxX, minY, maxY } = bounds(width, height);
      const start = { x: event.clientX, y: event.clientY };
      const origin = position.current;
      const samples: (Point & { t: number })[] = [];
      let dragging = false;
      let frame = 0;

      const handleMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - start.x;
        const dy = moveEvent.clientY - start.y;
        if (!dragging) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
          dragging = true;
          card.dataset.dragging = '';
        }

        const point = {
          x: clamp(origin.x + dx, minX, maxX),
          y: clamp(origin.y + dy, minY, maxY),
        };
        samples.push({ ...point, t: moveEvent.timeStamp });
        while (moveEvent.timeStamp - samples[0]!.t > VELOCITY_WINDOW_MS) {
          samples.shift();
        }
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => place(point));
      };

      const handleEnd = () => {
        handle.removeEventListener('pointermove', handleMove);
        handle.removeEventListener('pointerup', handleEnd);
        handle.removeEventListener('pointercancel', handleEnd);
        cancelAnimationFrame(frame);
        if (!dragging) return;
        delete card.dataset.dragging;

        const first = samples[0]!;
        const last = samples.at(-1)!;
        const elapsed = last.t - first.t;
        const landing =
          elapsed > 0
            ? {
                x: last.x + ((last.x - first.x) / elapsed) * FLING_MS,
                y: last.y + ((last.y - first.y) / elapsed) * FLING_MS,
              }
            : last;

        position.current = last;
        usePlayer
          .getState()
          .setMiniPlayerCorner(nearestCorner(landing, width, height));
        placeInCorner(true);
      };

      handle.addEventListener('pointermove', handleMove);
      handle.addEventListener('pointerup', handleEnd);
      handle.addEventListener('pointercancel', handleEnd);
    },
    [cardRef, floating, place, placeInCorner],
  );
};

/**
 * Animates the card between the full and mini layouts: it is measured before
 * and after the switch, and the difference is played back as a transform
 * (FLIP), so the switch itself costs one layout. The bar has another shape,
 * so it slides in and out instead.
 */
export const useLayoutTransition = (
  cardRef: RefObject<HTMLElement | null>,
  layout: PlayerLayout,
) => {
  const from = useRef<{ rect: DOMRect; layout: PlayerLayout }>(undefined);

  // Store listeners run before React re-renders, while the old layout is up.
  useEffect(
    () =>
      usePlayer.subscribe((state, previous) => {
        const card = cardRef.current;
        if (card && layoutOf(state) !== layoutOf(previous)) {
          from.current = {
            rect: card.getBoundingClientRect(),
            layout: layoutOf(previous),
          };
        }
      }),
    [cardRef],
  );

  useLayoutEffect(() => {
    const card = cardRef.current;
    const first = from.current;
    from.current = undefined;
    if (!card || !first || first.layout === layout || reducedMotion()) return;

    // Measured after every layout effect of this commit (the frame's scroll
    // lock can still move the page), but before the browser paints.
    queueMicrotask(() => {
      const last = card.getBoundingClientRect();
      if (!last.width || !last.height) return;

      const options = { duration: DURATION_MS, easing: EASE };
      if (first.layout === 'bar' || layout === 'bar') {
        card.animate(
          [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1 }],
          options,
        );
        return;
      }

      const { rect } = first;
      // Controls are laid out for the new size, so scaling them looks wrong:
      // they stay hidden while the video moves and fade in at the end.
      for (const child of card.children) {
        if (child.querySelector('iframe')) continue;
        child.animate(
          [{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }],
          options,
        );
      }
      card.animate(
        [
          {
            transformOrigin: '0 0',
            transform: `translate(${rect.left - last.left}px, ${rect.top - last.top}px) scale(${rect.width / last.width}, ${rect.height / last.height})`,
          },
          { transformOrigin: '0 0', transform: 'none' },
        ],
        options,
      );
    });
  }, [cardRef, layout]);
};
