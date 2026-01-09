/** biome-ignore-all lint/correctness/useHookAtTopLevel: . */
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Spinner } from '@/components/ui/spinner';
import useReadChapterData from '../../hooks/use-read-chapter-data';
import { useReader } from '../../hooks/use-reader';
import { ReaderType } from '../../reader.enums';
import MangaPageIndicator from '../ui/manga/manga-page-indicator';
import MangaScaleIndicator from '../ui/manga/manga-scale-indicator';
import MangaNextPage from '../ui/manga-next-page';

const MotionCarousel = motion.create(Carousel);

const MangaRenderer = () => {
  const {
    settings,
    setSettings,
    carouselApi,
    setCarouselApi,
    currentChapter,
    nextChapter,
  } = useReader();
  if (settings.type !== ReaderType.Manga) return;

  const { data: chapterImages } = useReadChapterData();
  const [isLoading, setIsLoading] = useState(true);

  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const prevScaleRef = useRef(settings.scale);

  useEffect(() => {
    if (!chapterImages || !Array.isArray(chapterImages)) return;
    if (chapterImages.length === 0) return;
    setIsLoading(true);

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
      if (isManhwaDetected && !settings.scrollMode) {
        setSettings({ scrollMode: true });
      }
      setIsLoading(false);
    });
  }, [chapterImages]);

  useEffect(() => {
    if (!carouselApi) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          carouselApi.scrollPrev();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          carouselApi.scrollNext();
          break;
      }
    };

    // const handleScroll = () => {
    //   if (carouselApi && carouselApi.selectedScrollSnap() !== selectedPageIndex)
    //     setSelectedPageIndex(carouselApi.selectedScrollSnap());
    // };

    window.addEventListener('keydown', handleKeyDown);
    // carouselApi.on('scroll', handleScroll);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // carouselApi.off('scroll', handleScroll);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!currentChapter || !carouselApi) return;

    const handleScroll = () => {
      const isTransitionPage = !carouselApi.canScrollNext();
      const isLastImage =
        carouselApi.selectedScrollSnap() ===
        carouselApi.scrollSnapList().length - 2;

      if (isTransitionPage && !isLoading) {
        nextChapter();
        carouselApi.scrollTo(0);
      }

      // if (isLastImage) {
      //   const current = mangaData.chapters.findIndex(
      //     (chap) => chap.id === currentChapter.id,
      //   );
      //   const lastRead = getRead() - 1;

      //   if (current === -1) return;

      //   if (lastRead - current) {
      //     (
      //       document.body.querySelector(
      //         'div.rounded-lg.border:nth-child(2) button',
      //       ) as HTMLButtonElement
      //     )?.click();
      //   }
      // }
    };

    carouselApi.on('scroll', handleScroll);

    return () => {
      carouselApi.off('scroll', handleScroll);
    };
  }, [carouselApi, currentChapter, isLoading]);

  // todo
  // useLayoutEffect(() => {
  //   const scrollContainer = scrollContainerRef.current;
  //   if (settings.scrollMode && scrollContainer && prevScaleRef.current !== settings.scale) {
  //     const oldScale = prevScaleRef.current;
  //     const newScale = settings.scale;

  //     const effOldScale = oldScale - 0.6;
  //     const effNewScale = newScale - 0.6;

  //     if (effOldScale > 0 && effNewScale > 0) {
  //       const scaleRatio = effNewScale / effOldScale;
  //       const { scrollTop, clientHeight } = scrollContainer;
  //       const newScrollTop =
  //         (scrollTop + clientHeight / 2) * scaleRatio - clientHeight / 2;
  //       scrollContainer.scrollTop = newScrollTop;
  //     }
  //   }

  //   prevScaleRef.current = settings.scale;
  // }, [settings.scale, settings.scrollMode]);

  const layoutAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(16px)' },
    transition: { duration: 0.2 },
  };

  if (!chapterImages || !Array.isArray(chapterImages)) return;

  return (
    <>
      <MangaPageIndicator />
      <MangaScaleIndicator />
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            className="absolute z-10 flex size-full items-center justify-center bg-card"
            {...layoutAnimation}
          >
            <Spinner className="size-16" />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        {settings.scrollMode ? (
          <motion.div
            key="scroll"
            // ref={scrollContainerRef}
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
                  width: settings.scrollMode
                    ? `${(settings.scale - 0.6) * 100}%`
                    : `auto`,
                }}
              />
            ))}
          </motion.div>
        ) : (
          <MotionCarousel
            key="carousel"
            plugins={[WheelGesturesPlugin()]}
            orientation={settings.orientation}
            setApi={setCarouselApi}
            className="flex h-full"
            {...layoutAnimation}
          >
            <CarouselContent className="!m-0 h-full">
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
              <MangaNextPage />
            </CarouselContent>
          </MotionCarousel>
        )}
      </AnimatePresence>
    </>
  );
};

export default MangaRenderer;
