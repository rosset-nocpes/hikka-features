import { useCallback, useSyncExternalStore } from 'react';

import { useIsMobile } from '@/components/hooks/use-mobile';

import { MangaReadingMode, ReaderType } from '../reader.enums';
import useReadChapterData from './use-read-chapter-data';
import { isSideways, mangaMode, useReader } from './use-reader';

/**
 * The pages of `count` that each slide shows: one, or two side by side.
 * Wide pages are spreads already, so they stay alone, as may the cover.
 */
export const groupPages = (
  count: number,
  double: boolean,
  coverAlone: boolean,
  widePages: ReadonlySet<number>,
) => {
  if (!double) return Array.from({ length: count }, (_, page) => [page]);

  const slides: number[][] = [];
  let page = 0;
  if (coverAlone && count > 0) slides.push([page++]);
  while (page < count) {
    const pairs =
      page + 1 < count && !widePages.has(page) && !widePages.has(page + 1);
    slides.push(pairs ? [page, page + 1] : [page]);
    page += pairs ? 2 : 1;
  }
  return slides;
};

/** The open chapter's pages, as the carousel's slides group them. */
export const useMangaSlides = () => {
  const { data } = useReadChapterData();
  const pageCount = Array.isArray(data) ? data.length : 0;
  const mode = useReader(mangaMode);
  const doublePage = useReader(
    ({ settings }) => settings.type === ReaderType.Manga && settings.doublePage,
  );
  const coverAlone = useReader(
    ({ settings }) => settings.type === ReaderType.Manga && settings.coverAlone,
  );
  const widePages = useReader((state) => state.widePages);
  const isMobile = useIsMobile();

  // Phones are too narrow for two pages.
  const double = doublePage && isSideways(mode) && !isMobile;
  return {
    slides: groupPages(pageCount, double, coverAlone, widePages),
    double,
    pageCount,
  };
};

/**
 * The manga pages in view, as indexes into the chapter's: two for a double
 * page, both 0 outside manga.
 */
export const useMangaPage = () => {
  const carouselApi = useReader((state) => state.carouselApi);
  const stripPage = useReader((state) => state.stripPage);
  const mode = useReader(mangaMode);
  const { slides, pageCount } = useMangaSlides();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!carouselApi) return () => undefined;

      carouselApi.on('select', onStoreChange);
      carouselApi.on('reInit', onStoreChange);

      return () => {
        carouselApi.off('select', onStoreChange);
        carouselApi.off('reInit', onStoreChange);
      };
    },
    [carouselApi],
  );

  const getSnapshot = useCallback(
    () => carouselApi?.selectedScrollSnap() ?? 0,
    [carouselApi],
  );

  const snap = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  if (pageCount === 0) return { firstPage: 0, lastPage: 0, pageCount };
  if (mode === MangaReadingMode.Strip) {
    const page = Math.min(stripPage, pageCount - 1);
    return { firstPage: page, lastPage: page, pageCount };
  }
  // Past the last page are the chapter's end and the next one's start.
  const slide = slides[Math.min(snap, slides.length - 1)] ?? [0];
  return { firstPage: slide[0]!, lastPage: slide.at(-1)!, pageCount };
};

/** Pages in view counted from 1: "4", or "4–5" for a double page. */
export const pageRange = ({
  firstPage,
  lastPage,
}: {
  firstPage: number;
  lastPage: number;
}) =>
  firstPage === lastPage
    ? `${firstPage + 1}`
    : `${firstPage + 1}–${lastPage + 1}`;
