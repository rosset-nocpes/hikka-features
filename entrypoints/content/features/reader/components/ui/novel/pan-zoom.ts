import { animate, useMotionValue, useMotionValueEvent } from 'motion/react';
import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useState,
} from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 8;
/** How far a pointer moves before a tap becomes a drag. */
const DRAG_THRESHOLD = 4;
/** How much of the viewport an opened image fills at most. */
const VIEWPORT_FILL = 0.9;

export const spring = { type: 'spring', stiffness: 400, damping: 40 } as const;

interface Point {
  x: number;
  y: number;
}

export interface Box extends Point {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Where `thumb` sits once opened: as large as fits, centred. */
export const getFittedBox = (thumb: HTMLImageElement): Box => {
  const rect = thumb.getBoundingClientRect();
  const naturalWidth = thumb.naturalWidth || rect.width;
  const naturalHeight = thumb.naturalHeight || rect.height;

  const ratio = Math.min(
    (window.innerHeight * VIEWPORT_FILL) / naturalHeight,
    (window.innerWidth * VIEWPORT_FILL) / naturalWidth,
  );
  const width = naturalWidth * ratio;
  const height = naturalHeight * ratio;

  return {
    x: (window.innerWidth - width) / 2,
    y: (window.innerHeight - height) / 2,
    width,
    height,
  };
};

type GestureMove =
  | { type: 'pinch'; pan: Point; zoom: number; center: Point }
  | { type: 'drag'; delta: Point };

/** The pointers on the viewer, read as a tap, a drag or a pinch. */
class PointerGesture {
  /** Whether the gesture went past a tap, so the click ending it is ignored. */
  moved = false;
  private readonly pointers = new Map<number, Point>();
  private start: Point = { x: 0, y: 0 };
  private pinch = { distance: 0, center: { x: 0, y: 0 } };

  down(id: number, point: Point) {
    this.pointers.set(id, point);
    if (this.pointers.size === 1) {
      this.moved = false;
      this.start = point;
    } else if (this.pointers.size === 2) {
      this.pinch = this.measurePinch();
    }
  }

  /** How the view should follow; undefined while it's still a tap. */
  move(id: number, point: Point): GestureMove | undefined {
    const previous = this.pointers.get(id);
    if (!previous) return undefined;
    this.pointers.set(id, point);

    if (this.pointers.size === 2) {
      const pinch = this.measurePinch();
      const move = {
        type: 'pinch' as const,
        pan: {
          x: pinch.center.x - this.pinch.center.x,
          y: pinch.center.y - this.pinch.center.y,
        },
        zoom: pinch.distance / this.pinch.distance,
        center: pinch.center,
      };
      this.pinch = pinch;
      this.moved = true;
      return move;
    }

    if (
      !this.moved &&
      Math.hypot(point.x - this.start.x, point.y - this.start.y) <
        DRAG_THRESHOLD
    ) {
      return undefined;
    }
    this.moved = true;
    return {
      type: 'drag',
      delta: { x: point.x - previous.x, y: point.y - previous.y },
    };
  }

  /** Whether that was the last pointer. */
  up(id: number) {
    this.pointers.delete(id);
    return this.pointers.size === 0;
  }

  private measurePinch() {
    const [a, b] = [...this.pointers.values()] as [Point, Point];
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  }
}

const pointOf = (e: { clientX: number; clientY: number }): Point => ({
  x: e.clientX,
  y: e.clientY,
});

/**
 * Zooming and panning an image laid out at `box`: by wheel, pinch, drag or
 * the returned controls. The image never pans past its edges.
 */
export const usePanZoom = (
  box: Box,
  overlayRef: RefObject<HTMLElement | null>,
) => {
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [gesture] = useState(() => new PointerGesture());

  const [zoomed, setZoomed] = useState(false);
  const [panning, setPanning] = useState(false);

  useMotionValueEvent(scale, 'change', (value) =>
    setZoomed(value > MIN_SCALE + 0.01),
  );

  const clampPan = useCallback(
    (value: number, axis: 'x' | 'y', currentScale: number) => {
      const size = axis === 'x' ? box.width : box.height;
      const viewport = axis === 'x' ? window.innerWidth : window.innerHeight;
      const limit = Math.max(0, (size * currentScale - viewport) / 2);
      return clamp(value, -limit, limit);
    },
    [box],
  );

  /** Zooms keeping `origin`, the viewport's centre by default, in place. */
  const zoomTo = useCallback(
    (nextScale: number, origin?: Point, animated = true) => {
      const target = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      const ratio = target / scale.get();

      const dx = (origin?.x ?? window.innerWidth / 2) - (box.x + box.width / 2);
      const dy =
        (origin?.y ?? window.innerHeight / 2) - (box.y + box.height / 2);

      for (const [value, to] of [
        [scale, target],
        [x, clampPan(dx - (dx - x.get()) * ratio, 'x', target)],
        [y, clampPan(dy - (dy - y.get()) * ratio, 'y', target)],
      ] as const) {
        if (animated) animate(value, to, spring);
        else value.jump(to);
      }
    },
    [box, clampPan, scale, x, y],
  );

  const zoomBy = useCallback(
    (factor: number) => zoomTo(scale.get() * factor),
    [scale, zoomTo],
  );

  const reset = useCallback(() => zoomTo(MIN_SCALE), [zoomTo]);

  // React's wheel listeners are passive, so they can't stop the page zooming.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaY;
      const factor = Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.002));
      zoomTo(scale.get() * factor, pointOf(e), false);
    };

    overlay.addEventListener('wheel', handleWheel, { passive: false });
    return () => overlay.removeEventListener('wheel', handleWheel);
  }, [overlayRef, scale, zoomTo]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-toolbar]')) return;
    gesture.down(e.pointerId, pointOf(e));
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const move = gesture.move(e.pointerId, pointOf(e));
    if (!move) return;

    if (move.type === 'pinch') {
      x.jump(x.get() + move.pan.x);
      y.jump(y.get() + move.pan.y);
      zoomTo(scale.get() * move.zoom, move.center, false);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (!zoomed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
    x.jump(clampPan(x.get() + move.delta.x, 'x', scale.get()));
    y.jump(clampPan(y.get() + move.delta.y, 'y', scale.get()));
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    if (gesture.up(e.pointerId)) setPanning(false);
  };

  return {
    scale,
    x,
    y,
    zoomed,
    panning,
    zoomTo,
    zoomBy,
    reset,
    gesture,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
};
