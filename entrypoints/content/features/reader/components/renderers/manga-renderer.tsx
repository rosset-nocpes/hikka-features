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

import { useIsMobile } from '@/components/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Spinner } from '@/components/ui/spinner';

import type { MangaSettings } from '../../reader.types';

import { useMangaSlides } from '../../hooks/use-manga-page';
import useReadChapterData from '../../hooks/use-read-chapter-data';
import { mangaMode, useReader } from '../../hooks/use-reader';
import { isOthersKey } from '../../keyboard';
import {
  FADE_BLUR,
  IMAGE_RETRY_DELAY_MS,
  MAX_IMAGE_RETRIES,
} from '../../reader.constants';
import { MangaReadingMode } from '../../reader.enums';
import MangaNextPage, { ChapterEnd } from '../ui/manga-next-page';
import MangaPageIndicator from '../ui/manga/manga-page-indicator';
import MangaScaleIndicator, {
  zoomStrip,
} from '../ui/manga/manga-scale-indicator';

const MotionCarousel = motion.create(Carousel);

/** Pages this much taller than wide are a long strip's, as manhwa has. */
const LONG_PAGE_RATIO = 3.5;

type MangaPageImageProps = Omit<
  ComponentPropsWithoutRef<'img'>,
  'onError' | 'onLoad' | 'src'
> & {
  src: string;
  /** Its index in the chapter. */
  page: number;
};

/**
 * A page of the chapter, loaded again a few times if it fails. Reports
 * itself when wider than tall, as a spread is.
 */
const MangaPageImage = ({ src, page, ...props }: MangaPageImageProps) => {
  const [retryCount, setRetryCount] = useState(0);
  const retryTimerRef = useRef<number>(undefined);
  const markWidePage = useReader((state) => state.markWidePage);

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
      alt={`Сторінка ${page + 1}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      draggable={false}
      onError={handleError}
      onLoad={({ currentTarget: img }) => {
        if (img.naturalWidth > img.naturalHeight) markWidePage(page);
      }}
      {...props}
    />
  );
};

/** Only rendered for manga. */
const MangaRenderer = () => {
  const { data } = useReadChapterData();
  const pages = Array.isArray(data) ? data : undefined;
  const mode = useReader(mangaMode);
  // The pages whose first few have loaded; a spinner covers them till then.
  const [loadedPages, setLoadedPages] = useState<string[]>();
  const isLoading = !pages || (pages.length > 0 && loadedPages !== pages);

  // Loads the first pages to tell a manhwa's long strips, which read best
  // as a strip.
  useEffect(() => {
    if (!pages?.length) return;

    let isLong = false;
    const imagesToLoad = pages.slice(0, 3).map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (img.naturalHeight / img.naturalWidth > LONG_PAGE_RATIO) {
              isLong = true;
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

      useReader.getState().setLongPages(isLong);
      setLoadedPages(pages);
    });

    return () => {
      isCurrentChapter = false;
    };
  }, [pages]);

  return (
    <>
      <MangaPageIndicator />
      <MangaScaleIndicator />
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            className="absolute z-10 flex size-full items-center justify-center bg-inherit"
            {...FADE_BLUR}
          >
            <Spinner className="size-16" />
          </motion.div>
        )}
      </AnimatePresence>
      {pages && mode && (
        <AnimatePresence mode="wait" initial={false}>
          {mode === MangaReadingMode.Strip ? (
            <StripView key="strip" pages={pages} isLoading={isLoading} />
          ) : (
            <PagedView
              // A new carousel for each way of paging, on the same page.
              key={mode}
              pages={pages}
              mode={mode}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>
      )}
    </>
  );
};

interface ViewProps {
  pages: string[];
  isLoading: boolean;
}

/** The page last shown, which a new way of paging opens on. */
let lastPage = { chapter: '', page: 0 };

const rememberPage = (chapter: string | undefined, page: number) => {
  lastPage = { chapter: chapter ?? '', page };
};

const pageToReopen = (chapter: string | undefined) =>
  lastPage.chapter === (chapter ?? '') ? lastPage.page : 0;

/** Pages one or two at a time, turned by swipes, wheel, keys or taps. */
const PagedView = ({
  pages,
  isLoading,
  mode,
}: ViewProps & { mode: MangaReadingMode }) => {
  const { carouselApi, setCarouselApi, currentChapter, nextChapter, turnPage } =
    useReader();
  const { slides, double } = useMangaSlides();
  const isRtl = mode === MangaReadingMode.RightToLeft;

  const carouselPlugins = useMemo(() => [WheelGesturesPlugin()], []);
  // Fixed once the carousel is made: embla starts over when they change.
  const [opts] = useState(() => ({
    direction: isRtl ? ('rtl' as const) : ('ltr' as const),
    startIndex: Math.max(
      0,
      slides.findIndex((slide) =>
        slide.includes(pageToReopen(currentChapter?.id)),
      ),
    ),
  }));

  const slidesRef = useRef(slides);
  useLayoutEffect(() => {
    const previous = slidesRef.current;
    slidesRef.current = slides;
    if (!carouselApi || previous === slides) return;

    // Regrouped round a spread: back to the page that was in view, once
    // embla has taken in the new slides.
    const page = previous[carouselApi.selectedScrollSnap()]?.[0] ?? 0;
    const index = slides.findIndex((slide) => slide.includes(page));
    if (index === -1) return;
    const frame = requestAnimationFrame(() =>
      carouselApi.scrollTo(index, true),
    );
    return () => cancelAnimationFrame(frame);
  }, [carouselApi, slides]);

  useEffect(() => {
    if (!carouselApi) return;

    const remember = () => {
      const slide = slidesRef.current[carouselApi.selectedScrollSnap()];
      if (slide)
        rememberPage(useReader.getState().currentChapter?.id, slide[0]!);
    };
    carouselApi.on('select', remember);
    return () => {
      carouselApi.off('select', remember);
    };
  }, [carouselApi]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading || isOthersKey(e)) return;

      const offset = (
        {
          ArrowLeft: isRtl ? 1 : -1,
          ArrowRight: isRtl ? -1 : 1,
          ArrowUp: -1,
          ArrowDown: 1,
          PageUp: -1,
          PageDown: 1,
          ' ': e.shiftKey ? -1 : 1,
        } as Record<string, 1 | -1>
      )[e.key];
      if (!offset) return;

      e.preventDefault();
      turnPage(offset);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, isRtl, turnPage]);

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

  return (
    <MotionCarousel
      plugins={carouselPlugins}
      opts={opts}
      orientation={
        mode === MangaReadingMode.Vertical ? 'vertical' : 'horizontal'
      }
      setApi={setCarouselApi}
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex h-full"
      {...FADE_BLUR}
    >
      <CarouselContent className="m-0! h-full">
        {slides.map((slide) => (
          <CarouselItem
            key={`${currentChapter?.id}-${slide.join('-')}`}
            className="h-full"
          >
            <div className="flex h-full items-center justify-center">
              {slide.map((page) => (
                <MangaPageImage
                  key={page}
                  src={pages[page]!}
                  page={page}
                  className={cn(
                    'h-full min-w-0 object-contain',
                    double && slide.length === 2 && 'max-w-1/2',
                  )}
                />
              ))}
            </div>
          </CarouselItem>
        ))}
        <MangaNextPage />
      </CarouselContent>
    </MotionCarousel>
  );
};

/** Every page in one scrolled column, with the chapter's end after them. */
const StripView = ({ pages }: ViewProps) => {
  const {
    settings: readerSettings,
    currentChapter,
    setCarouselApi,
  } = useReader();
  const settings = readerSettings as MangaSettings;
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevWidthRef = useRef(settings.stripWidth);

  // The carousel is gone; nothing should turn its pages.
  useEffect(() => setCarouselApi(undefined), [setCarouselApi]);

  // A new chapter starts at its top.
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    useReader.getState().setStripPage(0);
  }, [currentChapter?.id]);

  // Follows the page at the middle of the view, for the page number.
  useEffect(() => {
    const strip = scrollRef.current;
    if (!strip) return;

    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const middle = strip.scrollTop + strip.clientHeight / 2;
        let page = 0;
        strip.querySelectorAll('img').forEach((img, index) => {
          if (img.offsetTop <= middle) page = index;
        });
        const { stripPage, setStripPage, currentChapter } =
          useReader.getState();
        if (page !== stripPage) setStripPage(page);
        rememberPage(currentChapter?.id, page);
      });
    };

    strip.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      strip.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const strip = scrollRef.current;
      if (!strip || isOthersKey(e)) return;

      if (e.key === '+' || e.key === '=' || e.key === '-') {
        e.preventDefault();
        zoomStrip(e.key === '-' ? -1 : 1);
        return;
      }

      // Arrows nudge the strip, a space or page key moves a screen.
      const screen = strip.clientHeight * 0.85;
      const step = strip.clientHeight * 0.2;
      const distance = (
        {
          ArrowUp: -step,
          ArrowDown: step,
          PageUp: -screen,
          PageDown: screen,
          ' ': e.shiftKey ? -screen : screen,
        } as Record<string, number>
      )[e.key];
      if (!distance) return;

      e.preventDefault();
      strip.scrollBy({ top: distance, behavior: 'smooth' });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Widening the strip keeps the middle of the view in place.
  useLayoutEffect(() => {
    const strip = scrollRef.current;
    const oldWidth = prevWidthRef.current;
    prevWidthRef.current = settings.stripWidth;
    if (!strip || isMobile || oldWidth === settings.stripWidth) return;

    const { scrollTop, clientHeight } = strip;
    strip.scrollTop =
      (scrollTop + clientHeight / 2) * (settings.stripWidth / oldWidth) -
      clientHeight / 2;
  }, [settings.stripWidth, isMobile]);

  return (
    <motion.div
      ref={scrollRef}
      className={cn(
        'no-scrollbar relative flex flex-1 flex-col items-center overflow-auto',
        settings.stripGaps && 'gap-4',
      )}
      {...FADE_BLUR}
    >
      {pages.map((url, index) => (
        <MangaPageImage
          key={`${currentChapter?.id}-${index}`}
          src={url}
          page={index}
          // Phones fit the strip to their width; zoom is a pinch away.
          className="max-w-none max-md:w-full!"
          style={{ width: `${settings.stripWidth}%` }}
        />
      ))}
      <ChapterEnd className="min-h-[50%] w-full shrink-0 px-4 py-16" />
    </motion.div>
  );
};

export default MangaRenderer;
