import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { AnimatePresence, motion } from 'framer-motion';
import { type FC, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { useSidebar } from '@/components/ui/sidebar';
import { useReaderContext } from './context/reader-context';
import ReaderNextPages from './reader-next-pages';

interface Props {
  setCarouselApi?: React.Dispatch<
    React.SetStateAction<CarouselApi | undefined>
  >;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const MotionCarousel = motion.create(Carousel);

const ChapterPages: FC<Props> = ({ setCarouselApi, scrollContainerRef }) => {
  const {
    chapterImages,
    imagesLoading,
    orientation,
    scrollMode,
    setScrollMode,
    scale,
  } = useReaderContext();
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const prevScaleRef = useRef(scale);

  const { open } = useSidebar();

  useEffect(() => {
    if (chapterImages.length === 0) return;

    let isManhwaDetected = false;
    const imagesToLoad = chapterImages.slice(0, 3).map((img_url) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.naturalHeight / img.naturalWidth;
          if (aspectRatio > 3.5) {
            isManhwaDetected = true;
          }
          resolve();
        };
        img.onerror = () => {
          console.error('Failed to load image:', img_url);
          resolve();
        };
        img.src = img_url;
      });
    });

    Promise.all(imagesToLoad).then(() => {
      if (isManhwaDetected && !scrollMode) {
        setScrollMode(true);
      }
    });
  }, [chapterImages]);

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollMode && scrollContainer && prevScaleRef.current !== scale) {
      const oldScale = prevScaleRef.current;
      const newScale = scale;

      const effOldScale = oldScale - 0.6;
      const effNewScale = newScale - 0.6;

      if (effOldScale > 0 && effNewScale > 0) {
        const scaleRatio = effNewScale / effOldScale;
        const { scrollTop, clientHeight } = scrollContainer;
        const newScrollTop =
          (scrollTop + clientHeight / 2) * scaleRatio - clientHeight / 2;
        scrollContainer.scrollTop = newScrollTop;
      }
    }

    prevScaleRef.current = scale;
  }, [scale, scrollMode]);

  const topImageIndexRef = useRef(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // 1. Find the index of the image closest to the top of the container
      const index = chapterImages.findIndex((_, i) => {
        const img = imageRefs.current[i];
        // Check if image top is roughly at or past the container's top
        return img && img.offsetTop >= container.scrollTop;
      });

      topImageIndexRef.current = index >= 0 ? index : 0;
    }
  }, [open]); // Fires when the sidebar state changes

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    const targetImage = imageRefs.current[topImageIndexRef.current];

    if (container && targetImage) {
      // 2. Snap the container back to that specific image's new offsetTop
      container.scrollTop = targetImage.offsetTop;
    }
  }, [open]); // Triggered after the width changes

  const layoutAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(16px)' },
    transition: { duration: 0.2 },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {scrollMode ? (
        <motion.div
          layout
          key="scroll"
          ref={scrollContainerRef}
          className="no-scrollbar flex flex-1 flex-col items-center overflow-auto"
          {...layoutAnimation}
        >
          {chapterImages.map((img_url, index) => (
            <img
              key={index}
              ref={(el) => {
                imageRefs.current[index] = el;
              }}
              src={img_url}
              alt="Chapter page"
              loading="lazy"
              style={{
                width: scrollMode ? `${(scale - 0.6) * 100}%` : `auto`,
              }}
            />
          ))}
        </motion.div>
      ) : (
        <MotionCarousel
          key="carousel"
          plugins={[WheelGesturesPlugin()]}
          orientation={orientation}
          setApi={setCarouselApi}
          className="flex h-full"
          {...layoutAnimation}
        >
          <CarouselContent className="m-0! h-full">
            {imagesLoading && <CarouselItem className="size-full" />}
            {chapterImages.map((img_url, index) => {
              return (
                <CarouselItem key={index} className="h-full">
                  <div className="flex h-full items-center justify-center">
                    <img
                      ref={(el) => {
                        imageRefs.current[index] = el;
                      }}
                      src={img_url}
                      alt="Chapter page"
                      className="h-full object-contain"
                    />
                  </div>
                </CarouselItem>
              );
            })}
            <ReaderNextPages />
          </CarouselContent>
        </MotionCarousel>
      )}
    </AnimatePresence>
  );
};

export default ChapterPages;
