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
import { useShallow } from 'zustand/react/shallow';

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
  LONG_PAGE_RATIO,
  LONG_PAGE_SAMPLE,
  MAX_IMAGE_RETRIES,
  STRIP_ARROW_SCROLL,
  STRIP_PAGE_SCROLL,
} from '../../reader.constants';
import { MangaReadingMode } from '../../reader.enums';
import MangaNextPage, { ChapterEnd } from '../ui/manga-next-page';
import MangaPageIndicator from '../ui/manga/manga-page-indicator';
import MangaScaleIndicator, {
  zoomStrip,
} from '../ui/manga/manga-scale-indicator';

const MotionCarousel = motion.create(Carousel);

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
    const imagesToLoad = pages.slice(0, LONG_PAGE_SAMPLE).map(
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
            data-reader-loading
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
    useReader(
      useShallow((state) => ({
        carouselApi: state.carouselApi,
        setCarouselApi: state.setCarouselApi,
        currentChapter: state.currentChapter,
        nextChapter: state.nextChapter,
        turnPage: state.turnPage,
      })),
    );
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

  // Gone, its carousel can't turn pages: taps and keys then do nothing.
  useEffect(() => () => setCarouselApi(undefined), [setCarouselApi]);

  const slidesRef = useRef(slides);
  /** Slides are being regrouped: embla's moves aren't the reader's. */
  const regroupingRef = useRef(false);
  useLayoutEffect(() => {
    const previous = slidesRef.current;
    slidesRef.current = slides;
    if (!carouselApi || previous === slides) return;

    // Regrouped round a spread: back to the page that was in view, once
    // embla has taken in the new slides. Past the pages, the chapter's end
    // keeps its place after them.
    const snap = carouselApi.selectedScrollSnap();
    const page = previous[snap]?.[0];
    const index =
      page === undefined
        ? slides.length + snap - previous.length
        : slides.findIndex((slide) => slide.includes(page));
    if (index < 0) return;
    // Embla takes in the new slides at its old index, which can land on the
    // slide that opens the next chapter.
    regroupingRef.current = true;
    const frame = requestAnimationFrame(() => {
      carouselApi.scrollTo(index, true);
      regroupingRef.current = false;
    });
    return () => {
      cancelAnimationFrame(frame);
      regroupingRef.current = false;
    };
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
      if (regroupingRef.current || isLoading) return;
      if (!carouselApi.canScrollNext()) nextChapter();
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
      // The reader's own keys turn pages, the right way when right to left.
      onKeyDownCapture={undefined}
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

/** Keys that scroll the strip. */
const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

/** Every page in one scrolled column, with the chapter's end after them. */
const StripView = ({ pages }: ViewProps) => {
  const {
    settings: readerSettings,
    currentChapter,
    setCarouselApi,
  } = useReader(
    useShallow((state) => ({
      settings: state.settings,
      currentChapter: state.currentChapter,
      setCarouselApi: state.setCarouselApi,
    })),
  );
  const settings = readerSettings as MangaSettings;
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevWidthRef = useRef(settings.stripWidth);
  /** The chapter the strip shows, unset till it first lays out. */
  const shownChapterRef = useRef<string>(undefined);

  // The carousel is gone; nothing should turn its pages.
  useEffect(() => setCarouselApi(undefined), [setCarouselApi]);

  // Opens on the page the pages were turned to, and a new chapter at its top.
  useLayoutEffect(() => {
    const strip = scrollRef.current;
    const chapter = currentChapter?.id ?? '';
    const opening = shownChapterRef.current === undefined;
    shownChapterRef.current = chapter;

    const page = opening ? pageToReopen(chapter) : 0;
    useReader.getState().setStripPage(page);
    if (!strip) return;
    if (page === 0) {
      strip.scrollTo({ top: 0 });
      return;
    }

    const img = strip.querySelectorAll('img')[page];
    if (!img) return;
    img.loading = 'eager';

    // Where the page number reads it: a short page centred, a tall one from
    // its top.
    const show = () => {
      if (img.offsetHeight === 0) return;
      strip.scrollTop =
        img.offsetTop -
        Math.max(0, (strip.clientHeight - img.offsetHeight) / 2);
    };
    // Pages above it grow as they load, so it's shown again after each,
    // until the reader scrolls themselves.
    const stop = () => {
      strip.removeEventListener('load', show, true);
      strip.removeEventListener('wheel', stop);
      strip.removeEventListener('touchstart', stop);
      strip.removeEventListener('pointerdown', stop);
      window.removeEventListener('keydown', stopOnScrollKey);
    };
    const stopOnScrollKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) stop();
    };
    show();
    strip.addEventListener('load', show, true);
    strip.addEventListener('wheel', stop, { passive: true });
    strip.addEventListener('touchstart', stop, { passive: true });
    strip.addEventListener('pointerdown', stop);
    window.addEventListener('keydown', stopOnScrollKey);
    return stop;
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
          // Unloaded pages have no height and bunch up below loaded ones.
          if (img.offsetHeight > 0 && img.offsetTop <= middle) page = index;
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
      const screen = strip.clientHeight * STRIP_PAGE_SCROLL;
      const step = strip.clientHeight * STRIP_ARROW_SCROLL;
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
