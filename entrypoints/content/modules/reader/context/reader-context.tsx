import { FC, PropsWithChildren, useEffect } from "react";
import { create } from "zustand";

interface ReaderState {
  /* Base */
  container?: HTMLElement;
  /* Reader-related */
  currentChapter?: API.ChapterData;
  chapterImages: string[];
  imagesLoading: boolean;
  sidebarMode: "offcanvas" | "icon";
  scrollMode: boolean;
  orientation: "vertical" | "horizontal";
  scale: number;
}

interface ReaderActions {
  initialize: (data: API.ReadData, container: HTMLElement) => void;
  setChapter: (chapter: API.ChapterData) => void;
  setChapterImages: (images: string[], loading: boolean) => void;
  setSidebarMode: (mode: ReaderState["sidebarMode"]) => void;
  setScrollMode: (enabled: boolean) => void;
  setOrientation: (orientation: string) => void;
  setScale: (scale: number) => void;
  setState: (
    state: Partial<ReaderState> | ((prev: ReaderState) => Partial<ReaderState>),
  ) => void;
}

export const useReaderContext = create<ReaderState & ReaderActions>((set) => ({
  chapterImages: [],
  imagesLoading: true,
  sidebarMode: "offcanvas", // todo: move to local storage
  scrollMode: false,
  orientation: "vertical",
  scale: 1,

  initialize: (data, container) => {
    set({
      currentChapter: data.chapters[0],
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
  setState: (state) => set(state),
}));

export const getRead = (): number => {
  const selector = "div.rounded-lg.border:nth-child(2) h3";
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
  }, [data, initialize]);

  // Call useReadChapterData at the top level
  const { data: chapterImagesData, isLoading } = useReadChapterData(
    currentChapter?.chapter!,
  );

  // useEffect to update state when chapterImagesData changes
  useEffect(() => {
    setChapterImages(chapterImagesData?.images || [], isLoading);
  }, [chapterImagesData, isLoading, setChapterImages]);

  return <>{children}</>;
};
