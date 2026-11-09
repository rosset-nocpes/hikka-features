import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { AnimatePresence, motion } from 'motion/react';
import {
  type ComponentPropsWithoutRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Spinner } from '@/components/ui/spinner';

import type { MangaSettings } from '../../reader.types';

import useReadChapterData from '../../hooks/use-read-chapter-data';
import { useReader } from '../../hooks/use-reader';
import { FADE_BLUR } from '../../reader.constants';
import { ReaderType } from '../../reader.enums';
import MangaNextPage from '../ui/manga-next-page';
import MangaPageIndicator from '../ui/manga/manga-page-indicator';
import MangaScaleIndicator from '../ui/manga/manga-scale-indicator';

const MotionCarousel = motion.create(Carousel);

const MAX_IMAGE_RETRIES = 3;
const IMAGE_RETRY_DELAY_MS = 1_000;

type MangaPageImageProps = Omit<
  ComponentPropsWithoutRef<'img'>,
  'onError' | 'src'
> & {
  src: string;
};

/** A page of the chapter, loaded again a few times if it fails. */
const MangaPageImage = ({ src, ...props }: MangaPageImageProps) => {
  const [retryCount, setRetryCount] = useState(0);
  const retryTimerRef = useRef<number>(undefined);

  useEffect(
    () => () => {
      if (retryTimerRef.current !== undefined) {
        window.clearTimeout(retryTimerRef.current);
      }
    },
    [],
  );

  const handleError = () => {
    if (retryCount >= MAX_IMAGE_RETRIES) {
      console.error('Failed to load image after retries:', src);
      return;
    }
    if (retryTimerRef.current !== undefined) return;

    retryTimerRef.current = window.setTimeout(
      () => {
        retryTimerRef.current = undefined;
        setRetryCount((count) => count + 1);
      },
      IMAGE_RETRY_DELAY_MS * 2 ** retryCount,
    );
  };

  return (
    <img
      key={retryCount}
      src={src}
      alt="Chapter page"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={handleError}
      {...props}
    />
  );
};

/** Only rendered for manga. */
const MangaRenderer = () => {
  const {
    settings: readerSettings,
    carouselApi,
    setCarouselApi,
    currentChapter,
    nextChapter,
  } = useReader();
  const settings = readerSettings as MangaSettings;

  const { data } = useReadChapterData();
  const pages = Array.isArray(data) ? data : undefined;
  // The pages whose first few have loaded; a spinner covers them till then.
  const [loadedPages, setLoadedPages] = useState<string[]>();
  const isLoading = !pages || (pages.length > 0 && loadedPages !== pages);

  const carouselPlugins = useMemo(() => [WheelGesturesPlugin()], []);
  const prevScaleRef = useRef(settings.scale);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Loads the first pages to tell a manhwa's long strips, which read best
  // in scroll mode.
  useEffect(() => {
    if (!pages?.length) return;

    let isManhwaDetected = false;
    const imagesToLoad = pages.slice(0, 3).map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (img.naturalHeight / img.naturalWidth > 3.5) {
              isManhwaDetected = true;
            }
            resolve();
          };
          img.onerror = () => {
            console.error('Failed to load image:', url);
            resolve();
          };
          img.referrerPolicy = 'no-referrer';
          img.src = url;
        }),
    );

    let isCurrentChapter = true;

    void Promise.all(imagesToLoad).then(() => {
      if (!isCurrentChapter) return;

      const { settings, setSettings } = useReader.getState();
      if (
        isManhwaDetected &&
        settings.type === ReaderType.Manga &&
        !settings.scrollMode
      ) {
        setSettings({ scrollMode: true });
      }
      setLoadedPages(pages);
    });

    return () => {
      isCurrentChapter = false;
    };
  }, [pages]);

  useEffect(() => {
    if (!carouselApi) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;

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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carouselApi, isLoading]);

  useEffect(() => {
    if (!currentChapter || !carouselApi) return;

    // Scrolling past the "next chapter" page opens that chapter.
    const handleScroll = () => {
      if (!carouselApi.canScrollNext() && !isLoading) nextChapter();
    };

    carouselApi.on('scroll', handleScroll);
    return () => {
      carouselApi.off('scroll', handleScroll);
    };
  }, [carouselApi, currentChapter, isLoading, nextChapter]);

  // Zooming the strip keeps the middle of the view in place. A page is
  // (scale - 0.6) * 1000px wide.
  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const oldScale = prevScaleRef.current;
    prevScaleRef.current = settings.scale;
    if (!settings.scrollMode || !scrollContainer) return;
    if (oldScale === settings.scale) return;

    const oldWidth = oldScale - 0.6;
    const newWidth = settings.scale - 0.6;
    if (oldWidth > 0 && newWidth > 0) {
      const { scrollTop, clientHeight } = scrollContainer;
      scrollContainer.scrollTop =
        (scrollTop + clientHeight / 2) * (newWidth / oldWidth) -
        clientHeight / 2;
    }
  }, [settings.scale, settings.scrollMode]);

  return (
    <>
      <MangaPageIndicator />
      <MangaScaleIndicator />
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            className="bg-card absolute z-10 flex size-full items-center justify-center"
            {...FADE_BLUR}
          >
            <Spinner className="size-16" />
          </motion.div>
        )}
      </AnimatePresence>
      {pages && (
        <AnimatePresence mode="wait" initial={false}>
          {settings.scrollMode ? (
            <motion.div
              key="scroll"
              ref={scrollContainerRef}
              className="no-scrollbar flex flex-1 flex-col items-center overflow-auto"
              {...FADE_BLUR}
            >
              {pages.map((url, index) => (
                <MangaPageImage
                  key={`${currentChapter?.id}-${index}`}
                  src={url}
                  // Phones fit the strip to their width; zoom is a pinch away.
                  className="max-w-none max-md:w-full!"
                  style={{ width: `${(settings.scale - 0.6) * 1000}px` }}
                />
              ))}
            </motion.div>
          ) : (
            <MotionCarousel
              key="carousel"
              plugins={carouselPlugins}
              orientation={settings.orientation}
              setApi={setCarouselApi}
              className="flex h-full"
              {...FADE_BLUR}
            >
              <CarouselContent className="m-0! h-full">
                {pages.map((url, index) => (
                  <CarouselItem
                    key={`${currentChapter?.id}-${index}`}
                    className="h-full"
                  >
                    <div className="flex h-full items-center justify-center">
                      <MangaPageImage
                        src={url}
                        className="h-full object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
                <MangaNextPage />
              </CarouselContent>
            </MotionCarousel>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

export default MangaRenderer;
