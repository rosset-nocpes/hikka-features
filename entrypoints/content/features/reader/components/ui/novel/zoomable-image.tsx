import { ExternalLink, Minus, Plus, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  type MotionValue,
  useTransform,
} from 'motion/react';
import {
  type MouseEvent,
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
import { type Box, getFittedBox, spring, usePanZoom } from './pan-zoom';

const ZOOM_STEP = 1.5;
const DOUBLE_TAP_SCALE = 2.5;

const OPEN_RADIUS = 8;
const OPEN_BORDER = 1;
const NO_CLIP = 'inset(0px 0px 0px 0px)';

/**
 * How the opened image animates from and back to `thumb`: clipped to the
 * chapter's scroll area, over it and with its corners. Without a visible
 * thumb it fades in place.
 */
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

  const handleBackdropClick = (e: MouseEvent) => {
    if (gesture.moved || e.target !== e.currentTarget) return;
    close();
  };

  const handleDoubleClick = (e: MouseEvent) => {
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
