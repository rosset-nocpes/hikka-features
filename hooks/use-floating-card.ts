import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
} from 'react';
import { create } from 'zustand';

export type FloatingCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/** Where a floating card is kept, e.g. in its feature's store. */
export interface CornerStore {
  get: () => FloatingCorner;
  set: (corner: FloatingCorner) => void;
}

/** Gap to the viewport edges; top corners also clear hikka's header. */
const MARGIN = 16;
const HEADER_HEIGHT = 64;
/** Between cards that share a corner. */
const STACK_GAP = 8;
/** Movement before a press on a handle turns into a drag. */
const DRAG_THRESHOLD = 4;
/** How far ahead a release is projected, so a flick goes where it's thrown. */
const FLING_MS = 150;
const VELOCITY_WINDOW_MS = 80;
export const FLOATING_DURATION_MS = 320;
export const FLOATING_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface Point {
  x: number;
  y: number;
}

interface StackedCard {
  corner: FloatingCorner;
  height: number;
  order: number;
}

/**
 * Every floating card on the page (the video's mini player, the music
 * player…), so cards in one corner stack instead of covering each other.
 */
const useFloatingStack = create<Record<string, StackedCard>>(() => ({}));

const setStacked = (id: string, card: StackedCard | undefined) =>
  useFloatingStack.setState((cards) => {
    const next = { ...cards };
    if (card) next[id] = card;
    else delete next[id];
    return next;
  }, true);

/** How far from its corner `id` sits: past the cards below it in order. */
const stackOffset = (cards: Record<string, StackedCard>, id: string) => {
  const own = cards[id];
  if (!own) return 0;
  let offset = 0;
  for (const [other, card] of Object.entries(cards)) {
    if (other !== id && card.corner === own.corner && card.order < own.order) {
      offset += card.height + STACK_GAP;
    }
  }
  return offset;
};

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Where the card's top-left corner may go: the viewport minus scrollbars and margins. */
const bounds = (width: number, height: number) => {
  const { clientWidth, clientHeight } = document.documentElement;
  // Narrow screens get thinner margins rather than a cut-off card.
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
  corner: FloatingCorner,
  width: number,
  height: number,
  offset: number,
): Point => {
  const { minX, maxX, minY, maxY } = bounds(width, height);
  return {
    x: corner.endsWith('left') ? minX : maxX,
    y: corner.startsWith('top')
      ? clamp(minY + HEADER_HEIGHT + offset, minY, maxY)
      : clamp(maxY - offset, minY, maxY),
  };
};

const nearestCorner = (
  point: Point,
  width: number,
  height: number,
): FloatingCorner => {
  const { clientWidth, clientHeight } = document.documentElement;
  const vertical = point.y + height / 2 < clientHeight / 2 ? 'top' : 'bottom';
  const horizontal = point.x + width / 2 < clientWidth / 2 ? 'left' : 'right';
  return `${vertical}-${horizontal}`;
};

interface FloatingCardOptions {
  /** Off: the card is laid out by the page, and its position is cleared. */
  floating: boolean;
  corner: CornerStore;
  /** In a shared corner, cards of lower order sit nearer its edge. */
  order: number;
  /** Places the card again when it changes, e.g. a layout of another size. */
  layoutKey?: unknown;
}

/**
 * Keeps a floating card in its corner and lets it be dragged to another.
 * The position is the card's CSS `translate`, written directly, so dragging
 * never re-renders it. Returns the `pointerdown` handler for handles.
 */
export const useFloatingCard = (
  cardRef: RefObject<HTMLElement | null>,
  { floating, corner, order, layoutKey }: FloatingCardOptions,
) => {
  const id = useId();
  const position = useRef<Point>({ x: 0, y: 0 });

  const place = useCallback(
    (point: Point, animate = false) => {
      const card = cardRef.current;
      if (!card) return;
      position.current = point;
      card.style.transition =
        animate && !reducedMotion()
          ? `translate ${FLOATING_DURATION_MS}ms ${FLOATING_EASE}`
          : '';
      card.style.translate = `${point.x}px ${point.y}px`;
    },
    [cardRef],
  );

  const placeInCorner = useCallback(
    (animate = false) => {
      const card = cardRef.current;
      if (!card || 'dragging' in card.dataset) return;
      place(
        cornerPoint(
          corner.get(),
          card.offsetWidth,
          card.offsetHeight,
          stackOffset(useFloatingStack.getState(), id),
        ),
        animate,
      );
    },
    [cardRef, corner, id, place],
  );

  // Before paint, so a new card never shows up at the viewport origin.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!floating) {
      card.style.translate = '';
      card.style.transition = '';
      return;
    }

    const register = () =>
      setStacked(id, {
        corner: corner.get(),
        height: card.offsetHeight,
        order,
      });
    register();
    placeInCorner();

    // Cards sharing the corner move along as others come, go or resize.
    let offset = stackOffset(useFloatingStack.getState(), id);
    const unsubscribe = useFloatingStack.subscribe((cards) => {
      const next = stackOffset(cards, id);
      if (next === offset) return;
      offset = next;
      placeInCorner(true);
    });
    const resizeObserver = new ResizeObserver(() => {
      if (useFloatingStack.getState()[id]?.height === card.offsetHeight) return;
      register();
      placeInCorner();
    });
    resizeObserver.observe(card);
    const handleResize = () => placeInCorner();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      unsubscribe();
      setStacked(id, undefined);
    };
  }, [cardRef, corner, floating, id, layoutKey, order, placeInCorner]);

  return useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const card = cardRef.current;
      if (!floating || !card || event.button !== 0) return;
      event.preventDefault();

      // Capture keeps the moves coming while the pointer is over an iframe.
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
        corner.set(nearestCorner(landing, width, height));
        const stacked = useFloatingStack.getState()[id];
        if (stacked) setStacked(id, { ...stacked, corner: corner.get() });
        placeInCorner(true);
      };

      handle.addEventListener('pointermove', handleMove);
      handle.addEventListener('pointerup', handleEnd);
      handle.addEventListener('pointercancel', handleEnd);
    },
    [cardRef, corner, floating, id, place, placeInCorner],
  );
};
