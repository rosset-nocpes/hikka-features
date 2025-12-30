import { type FC, type PropsWithChildren, useEffect } from 'react';
import { create } from 'zustand';

export interface NovelReaderState {
  /* Base */
  container?: HTMLElement;
  /* Reader-related */
  currentChapter?: NovelChapter;
  chapterPage: string; // or Element?
  sidebarMode: 'offcanvas' | 'icon';
  scale: number;
  fullscreen: boolean;
  sortBy: {
    field: 'chapter' | 'date_upload' | string;
    order: 'asc' | 'desc';
  };
}

interface NovelReaderActions {
  initialize: (data: NovelContent, container: HTMLElement) => void;
  setChapter: (chapter: NovelReaderState['currentChapter']) => void;
  setChapterPage: (chapterPage: NovelReaderState['chapterPage']) => void;
  setSidebarMode: (mode: NovelReaderState['sidebarMode']) => void;
  setScale: (scale: number) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setSortBy: (sortBy: NovelReaderState['sortBy']) => void;
  setState: (
    state:
      | Partial<NovelReaderState>
      | ((prev: NovelReaderState) => Partial<NovelReaderState>),
  ) => void;
  reset: () => void;
}

export const useNovelReader = create<NovelReaderState & NovelReaderActions>(
  (set) => ({
    sidebarMode: 'offcanvas', // todo: move to local storage
    chapterPage: '',
    scale: 1,
    fullscreen: false,
    sortBy: {
      field: 'chapter',
      order: 'asc',
    },

    initialize: (data, container) => {
      const targetChapter =
        data.displayMode === 'volumes'
          ? data.volumes[0].chapters[0]
          : data.chapters[0];

      set({
        currentChapter: targetChapter,
        container,
      });
    },
    setChapter: (chapter) => set({ currentChapter: chapter }),
    setChapterPage: (chapterPage) => set({ chapterPage }),
    setSidebarMode: (mode) => set({ sidebarMode: mode }),
    setScale: (scale) => set({ scale }),
    setFullscreen: (fullscreen) => set({ fullscreen }),
    setSortBy: (sortBy) => set({ sortBy }),
    setState: (state) => set(state),
    reset: () => {
      set({
        sidebarMode: 'offcanvas',
        scale: 1,
        currentChapter: undefined,
        container: undefined,
      });
    },
  }),
);

export const getRead = (): number => {
  const selector =
    '.grid > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div:nth-of-type(2) span';
  const element = document.querySelector(selector);
  return element?.firstChild?.nodeValue
    ? parseInt(element.firstChild.nodeValue, 10)
    : 0;
};

interface NovelReaderProviderProps extends PropsWithChildren {
  container: HTMLElement;
}

export const NovelReaderProvider: FC<NovelReaderProviderProps> = ({
  children,
  container,
}) => {
  const { initialize } = useNovelReader();
  const { data } = useNovelData();

  useEffect(() => {
    if (!data) return;

    initialize(data, container);
  }, [data]);

  return <>{children}</>;
};
