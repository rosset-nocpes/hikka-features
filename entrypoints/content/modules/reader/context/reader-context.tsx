import { type FC, type PropsWithChildren, useEffect } from 'react';
import { create } from 'zustand';

export interface ReaderState {
  /* Base */
  container?: HTMLElement;
  /* Reader-related */
  currentChapter?: API.ChapterData;
  chapterImages: string[];
  imagesLoading: boolean;
  sidebarMode: 'offcanvas' | 'icon';
  scrollMode: boolean;
  orientation: 'vertical' | 'horizontal';
  scale: number;
  fullscreen: boolean;
  sortBy: 'asc' | 'desc';
}

interface ReaderActions {
  initialize: (data: API.ReadData, container: HTMLElement) => void;
  setChapter: (chapter: API.ChapterData) => void;
  setChapterImages: (images: string[], loading: boolean) => void;
  setSidebarMode: (mode: ReaderState['sidebarMode']) => void;
  setScrollMode: (enabled: boolean) => void;
  setOrientation: (orientation: ReaderState['orientation']) => void;
  setScale: (scale: number) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setSortBy: (sortBy: ReaderState['sortBy']) => void;
  setState: (
    state: Partial<ReaderState> | ((prev: ReaderState) => Partial<ReaderState>),
  ) => void;
  reset: () => void;
}

export const useReaderContext = create<ReaderState & ReaderActions>((set) => ({
  chapterImages: [],
  imagesLoading: true,
  sidebarMode: 'offcanvas', // todo: move to local storage
  scrollMode: false,
  orientation: 'vertical',
  scale: 1,
  fullscreen: false,
  sortBy: 'asc',

  initialize: (data, container) => {
    const targetChapter = data.chapters[getRead()];

    set({
      currentChapter: targetChapter ?? data.chapters[0],
      imagesLoading: true,
      container,
    });
  },
  setChapter: (chapter) => set({ currentChapter: chapter }),
  setChapterImages: (images, loading) =>
    set({ chapterImages: images, imagesLoading: loading }),
  setSidebarMode: (mode) => set({ sidebarMode: mode }),
  setScrollMode: (enabled) => set({ scrollMode: enabled }),
  setOrientation: (orientation) => set({ orientation }),
  setScale: (scale) => set({ scale }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
  setSortBy: (sortBy) => set({ sortBy }),
  setState: (state) => set(state),
  reset: () => {
    set({
      chapterImages: [],
      imagesLoading: true,
      sidebarMode: 'offcanvas',
      scrollMode: false,
      orientation: 'vertical',
      scale: 1,
      currentChapter: undefined,
      container: undefined,
    });
  },
}));

export const getRead = (): number => {
  const selector =
    '.grid > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div:nth-of-type(2) span';
  const element = document.querySelector(selector);
  return element?.firstChild?.nodeValue
    ? parseInt(element.firstChild.nodeValue, 10)
    : 0;
};

interface ReaderProviderProps extends PropsWithChildren {
  container: HTMLElement;
}

export const ReaderProvider: FC<ReaderProviderProps> = ({
  children,
  container,
}) => {
  const { initialize, setChapterImages, currentChapter } = useReaderContext();
  const { data } = useReadData();

  useEffect(() => {
    if (!data) return;

    initialize(data, container);
  }, [data]);

  const { data: chapterImagesData, isLoading } = useReadChapterData(
    currentChapter?.id!,
    currentChapter?.url!,
  );

  useEffect(() => {
    const images = chapterImagesData?.images || [];
    let allImagesLoaded = !isLoading;

    if (!isLoading && images.length > 0) {
      allImagesLoaded = false;
      let loadedCount = 0;

      images.slice(0, 5).forEach((imgSrc) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === images.slice(0, 5).length) {
            setChapterImages(images, false);
          }
        };
        img.src = imgSrc;
      });
    }

    setChapterImages(images, !allImagesLoaded);
  }, [chapterImagesData, isLoading, setChapterImages]);

  return <>{children}</>;
};
