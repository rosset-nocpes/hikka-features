import { ExternalLink, Minus, Plus, X } from 'lucide-react';
import {
  animate,
  AnimatePresence,
  motion,
  type MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'motion/react';
import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';

import { useReader } from '../../../hooks/use-reader';
import { ReaderType } from '../../../reader.enums';

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.5;
const DOUBLE_TAP_SCALE = 2.5;
const DRAG_THRESHOLD = 4;
const VIEWPORT_FILL = 0.9;

const OPEN_RADIUS = 8;
const OPEN_BORDER = 1;
const NO_CLIP = 'inset(0px 0px 0px 0px)';

const spring = { type: 'spring', stiffness: 400, damping: 40 } as const;

interface Point {
  x: number;
  y: number;
}

interface Box extends Point {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getFittedBox = (thumb: HTMLImageElement): Box => {
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

const getThumbState = (thumb: HTMLImageElement | null, box: Box) => {
  const rect = thumb?.getBoundingClientRect();

  if (!thumb || !rect?.width) {
    return {
      clip: { clipPath: NO_CLIP },
      transform: { x: 0, y: 0, scale: 0.9, opacity: 0 },
      image: { borderRadius: OPEN_RADIUS, borderWidth: OPEN_BORDER },
    };
  }

  const scale = rect.width / box.width;
  const style = getComputedStyle(thumb);
  const viewport = thumb
    .closest('[data-slot="scroll-area-viewport"]')
    ?.getBoundingClientRect();

  const insets = viewport && [
    viewport.top,
    window.innerWidth - viewport.right,
    window.innerHeight - viewport.bottom,
    viewport.left,
  ];

  return {
    clip: {
      clipPath: insets
        ? `inset(${insets.map((inset) => `${Math.max(inset, 0)}px`).join(' ')})`
        : NO_CLIP,
    },
    transform: {
      x: rect.x + rect.width / 2 - (box.x + box.width / 2),
      y: rect.y + rect.height / 2 - (box.y + box.height / 2),
      scale,
      opacity: 1,
    },
    image: {
      borderRadius: parseFloat(style.borderTopLeftRadius) / scale,
      borderWidth: parseFloat(style.borderTopWidth) / scale,
    },
  };
};

type ThumbState = ReturnType<typeof getThumbState>;

interface ZoomableImageProps {
  src: string;
  alt?: string;
}

const ZoomableImage = ({ src, alt }: ZoomableImageProps) => {
  const { container } = useReader();
  const thumbRef = useRef<HTMLImageElement>(null);

  const [viewer, setViewer] = useState<{
    box: Box;
    portal: HTMLElement;
    thumbState: ThumbState;
  }>();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    const thumb = thumbRef.current;
    const portal =
      thumb?.closest<HTMLElement>('[data-reader-card]') ?? container;
    if (!thumb || !portal) return;

    const box = getFittedBox(thumb);
    setViewer({ box, portal, thumbState: getThumbState(thumb, box) });
    setOpen(true);
  };

  return (
    <>
      <img
        ref={thumbRef}
        src={src}
        alt={alt}
        className={cn('cursor-zoom-in', viewer && 'invisible')}
        onClick={handleOpen}
      />
      {viewer &&
        createPortal(
          <AnimatePresence onExitComplete={() => setViewer(undefined)}>
            {open && (
              <ImageViewer
                src={src}
                alt={alt}
                box={viewer.box}
                initialThumbState={viewer.thumbState}
                thumbRef={thumbRef}
                onClose={() => setOpen(false)}
              />
            )}
          </AnimatePresence>,
          viewer.portal,
        )}
    </>
  );
};

interface ImageViewerProps {
  src: string;
  alt?: string;
  box: Box;
  initialThumbState: ThumbState;
  thumbRef: RefObject<HTMLImageElement | null>;
  onClose: () => void;
}

const ImageViewer = ({
  src,
  alt,
  box,
  initialThumbState,
  thumbRef,
  onClose,
}: ImageViewerProps) => {
  const { settings } = useReader();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [closing, setClosing] = useState(false);

  const thumb = useRef(initialThumbState);

  const {
    scale,
    x,
    y,
    zoomed,
    panning,
    zoomTo,
    zoomBy,
    reset,
    gesture,
    handlers,
  } = usePanZoom(box, overlayRef);

  const close = useCallback(() => {
    thumb.current = getThumbState(thumbRef.current, box);
    setClosing(true);
    reset();
    onClose();
  }, [box, onClose, reset, thumbRef]);

  useEffect(() => {
    if (closing) return;

    const actions: Record<string, () => void> = {
      Escape: close,
      '+': () => zoomBy(ZOOM_STEP),
      '=': () => zoomBy(ZOOM_STEP),
      '-': () => zoomBy(1 / ZOOM_STEP),
      '0': reset,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const action = actions[e.key];
      if (!action) return;

      // capture phase, so Escape doesn't also close the reader
      e.preventDefault();
      e.stopPropagation();
      action();
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [close, closing, reset, zoomBy]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (gesture.current.moved || e.target !== e.currentTarget) return;
    close();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (zoomed) reset();
    else zoomTo(DOUBLE_TAP_SCALE, { x: e.clientX, y: e.clientY });
  };

  return (
    <motion.div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 touch-none overflow-hidden select-none',
        closing ? 'pointer-events-none z-15' : 'z-9999',
        settings.type === ReaderType.Novel && settings.theme,
      )}
      {...handlers}
    >
      <motion.div
        className="bg-background/95 absolute inset-0 cursor-zoom-out"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={handleBackdropClick}
      />

      <motion.div
        className="pointer-events-none absolute inset-0"
        variants={{
          thumb: () => thumb.current.clip,
          open: { clipPath: NO_CLIP },
        }}
        initial="thumb"
        animate="open"
        exit="thumb"
        transition={spring}
      >
        <motion.div
          className="absolute origin-center"
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
          }}
          variants={{
            thumb: () => thumb.current.transform,
            open: { x: 0, y: 0, scale: 1, opacity: 1 },
          }}
          transition={spring}
        >
          <motion.img
            src={src}
            alt={alt}
            draggable={false}
            className={cn(
              'pointer-events-auto size-full origin-center border',
              zoomed
                ? panning
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-zoom-in',
            )}
            style={{ x, y, scale }}
            variants={{
              thumb: () => thumb.current.image,
              open: { borderRadius: OPEN_RADIUS, borderWidth: OPEN_BORDER },
            }}
            transition={spring}
            onDoubleClick={handleDoubleClick}
          />
        </motion.div>
      </motion.div>

      <ViewerToolbar
        scale={scale}
        src={src}
        onZoomIn={() => zoomBy(ZOOM_STEP)}
        onZoomOut={() => zoomBy(1 / ZOOM_STEP)}
        onReset={reset}
        onClose={close}
      />
    </motion.div>
  );
};

const usePanZoom = (box: Box, overlayRef: RefObject<HTMLElement | null>) => {
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

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

  const zoomTo = useCallback(
    (nextScale: number, origin?: Point, animated = true) => {
      const target = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      const ratio = target / scale.get();

      const dx = (origin?.x ?? window.innerWidth / 2) - (box.x + box.width / 2);
      const dy =
        (origin?.y ?? window.innerHeight / 2) - (box.y + box.height / 2);

      const next = {
        scale: target,
        x: clampPan(dx - (dx - x.get()) * ratio, 'x', target),
        y: clampPan(dy - (dy - y.get()) * ratio, 'y', target),
      };

      for (const [value, to] of [
        [scale, next.scale],
        [x, next.x],
        [y, next.y],
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

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaY;
      const factor = Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.002));
      zoomTo(scale.get() * factor, { x: e.clientX, y: e.clientY }, false);
    };

    overlay.addEventListener('wheel', handleWheel, { passive: false });
    return () => overlay.removeEventListener('wheel', handleWheel);
  }, [overlayRef, scale, zoomTo]);

  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef({
    moved: false,
    start: { x: 0, y: 0 },
    distance: 0,
    center: { x: 0, y: 0 },
  });

  const getPinch = () => {
    const [a, b] = [...pointers.current.values()] as [Point, Point];
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-toolbar]')) return;

    const point = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, point);

    if (pointers.current.size === 1) {
      Object.assign(gesture.current, { moved: false, start: point });
    } else if (pointers.current.size === 2) {
      Object.assign(gesture.current, getPinch());
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;

    const point = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, point);

    if (pointers.current.size === 2) {
      const { distance, center } = getPinch();
      const current = gesture.current;

      x.jump(x.get() + center.x - current.center.x);
      y.jump(y.get() + center.y - current.center.y);
      zoomTo((scale.get() * distance) / current.distance, center, false);

      Object.assign(current, { distance, center, moved: true });
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    const { start, moved } = gesture.current;
    if (
      !moved &&
      Math.hypot(point.x - start.x, point.y - start.y) < DRAG_THRESHOLD
    )
      return;

    gesture.current.moved = true;
    if (!zoomed) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
    x.jump(clampPan(x.get() + point.x - previous.x, 'x', scale.get()));
    y.jump(clampPan(y.get() + point.y - previous.y, 'y', scale.get()));
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setPanning(false);
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

interface ViewerToolbarProps {
  scale: MotionValue<number>;
  src: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClose: () => void;
}

const ViewerToolbar = ({
  scale,
  src,
  onZoomIn,
  onZoomOut,
  onReset,
  onClose,
}: ViewerToolbarProps) => {
  const percentage = useTransform(
    scale,
    (value) => `${Math.round(value * 100)}%`,
  );

  return (
    <motion.div
      data-toolbar
      className="bg-sidebar text-foreground absolute bottom-4 left-1/2 flex h-10 -translate-x-1/2 items-center gap-1 rounded-lg border px-1 font-medium shadow-lg"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        title="Зменшити"
        onClick={onZoomOut}
      >
        <Minus className="size-4" />
      </Button>
      <motion.button
        type="button"
        title="Скинути масштаб"
        className="hover:bg-muted min-w-14 rounded-md p-1 text-sm tabular-nums"
        onClick={onReset}
      >
        {percentage}
      </motion.button>
      <Button
        variant="ghost"
        size="icon-sm"
        title="Збільшити"
        onClick={onZoomIn}
      >
        <Plus className="size-4" />
      </Button>
      <div className="bg-border mx-1 h-5 w-px" />
      <Button
        variant="ghost"
        size="icon-sm"
        title="Відкрити в новій вкладці"
        nativeButton={false}
        render={<a href={src} target="_blank" rel="noopener noreferrer" />}
      >
        <ExternalLink className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" title="Закрити" onClick={onClose}>
        <X className="size-4" />
      </Button>
    </motion.div>
  );
};

export default ZoomableImage;
