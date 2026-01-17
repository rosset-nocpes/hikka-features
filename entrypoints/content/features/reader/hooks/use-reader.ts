import { type FC, type PropsWithChildren, useEffect } from 'react';
import { create } from 'zustand';
import type { CarouselApi } from '@/components/ui/carousel';
import { queryClient } from '@/entrypoints/content';
import {
  MangaOrientation,
  NovelTheme,
  ReaderContentMode,
  ReaderOrderBy,
  ReaderSortBy,
  ReaderType,
} from '../reader.enums';
import type {
  Chapter,
  MangaSettings,
  NovelSettings,
  ReaderContent,
  ReaderSettings,
} from '../reader.types';
import useReadData from './use-read-data';

export interface ReaderState {
  /* Base */
  container?: HTMLElement;
  /* Reader-related */
  currentChapter?: Chapter;
  chapterContent?: string[] | string; // remove this
  settings: ReaderSettings;
  /* Manga-related (idk where to put it for now) */
  carouselApi?: CarouselApi;
}

interface ReaderActions {
  initialize: (
    type: ReaderType,
    data: ReaderContent,
    container: HTMLElement,
  ) => void;
  setChapter: (chapter: Chapter) => void;
  nextChapter: () => void;
  prevChapter: () => void;
  setChapterContent: (content: string[] | string) => void; // remove this
  setSettings: (settings: Partial<ReaderSettings>) => void;
  toggleFullscreen: () => Promise<void>;
  syncFullscreen: (val: boolean) => void;
  setCarouselApi: (api: CarouselApi) => void;
  getRead: () => number;
  reset: () => void;
}

export const useReader = create<ReaderState & ReaderActions>((set, get) => ({
  settings: {
    fullscreen: false,
    sortBy: {
      field: ReaderSortBy.Chapter,
      order: ReaderOrderBy.Ascending,
    },
  } as ReaderSettings,

  initialize: (type, data, container) => {
    let initialSettings: Partial<ReaderSettings> = { type };

    if (type === ReaderType.Manga) {
      initialSettings = {
        ...initialSettings,
        scale: 1,
        orientation: MangaOrientation.Vertical,
        scrollMode: false,
      } as MangaSettings;
    }

    if (type === ReaderType.Novel) {
      initialSettings = {
        ...initialSettings,
        fontFamily: 'font-sans',
        fontSize: 16,
        theme: NovelTheme.Dark,
      } as NovelSettings;
    }

    const readIndex = get().getRead();
    const targetChapter =
      data.displayMode === ReaderContentMode.Chapters
        ? data.chapters[readIndex] || data.chapters[0]
        : data.volumes.flatMap((v) => v.chapters)[readIndex] ||
          data.volumes.flatMap((v) => v.chapters)[0];

    set((state) => ({
      settings: {
        ...state.settings,
        ...initialSettings,
      } as ReaderSettings,
      currentChapter: targetChapter,
      container,
    }));
  },
  setChapter: (chapter) => set({ currentChapter: chapter }),
  nextChapter: () => {
    const { settings, currentChapter } = get();
    const { slug } = usePageStore.getState();
    const data: ReaderContent | undefined = queryClient.getQueryData([
      'read-data',
      settings.type,
      slug,
    ]);
    if (!data || !currentChapter) return;

    if (data.displayMode === ReaderContentMode.Chapters) {
      const index = data.chapters.findIndex((c) => c.id === currentChapter.id);
      if (index === -1) return;
      const nextChapter = data.chapters[index + 1];
      if (!nextChapter) return;
      set({ currentChapter: nextChapter });
    }

    if (data.displayMode === ReaderContentMode.Volumes) {
      const volumeIndex = data.volumes.findIndex(
        (v) => v.number === currentChapter.volume,
      );
      if (volumeIndex === -1) return;
      const volume = data.volumes[volumeIndex];
      const chapterIndex = volume.chapters.findIndex(
        (c) => c.id === currentChapter.id,
      );
      if (chapterIndex === -1) return;
      const nextChapter = volume.chapters[chapterIndex + 1];
      if (!nextChapter) return;
      set({ currentChapter: nextChapter });
    }
  },
  prevChapter: () => {
    const { settings, currentChapter } = get();
    const { slug } = usePageStore.getState();
    const data: ReaderContent | undefined = queryClient.getQueryData([
      'read-data',
      settings.type,
      slug,
    ]);
    if (!data || !currentChapter) return;

    if (data.displayMode === ReaderContentMode.Chapters) {
      const index = data.chapters.findIndex((c) => c.id === currentChapter.id);
      if (index === -1) return;
      const previousChapter = data.chapters[index - 1];
      if (!previousChapter) return;
      set({ currentChapter: previousChapter });
    }

    if (data.displayMode === ReaderContentMode.Volumes) {
      const volumeIndex = data.volumes.findIndex(
        (v) => v.number === currentChapter.volume,
      );
      if (volumeIndex === -1) return;
      const volume = data.volumes[volumeIndex];
      const chapterIndex = volume.chapters.findIndex(
        (c) => c.id === currentChapter.id,
      );
      if (chapterIndex === -1) return;
      const previousChapter = volume.chapters[chapterIndex - 1];
      if (!previousChapter) return;
      set({ currentChapter: previousChapter });
    }
  },
  setChapterContent: (content) => set({ chapterContent: content }),
  setSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings,
      } as ReaderSettings,
    })),
  toggleFullscreen: async () => {
    try {
      const wrapper = get().container?.querySelector('div');

      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        wrapper?.classList.add('fullscreen');
      } else {
        await document.exitFullscreen();
        wrapper?.classList.remove('fullscreen');
      }
    } catch (err) {
      console.error(`Fullscreen error: ${err}`);
    }
  },

  syncFullscreen: (value) =>
    set((state) => ({
      settings: { ...state.settings, fullscreen: value },
    })),
  setCarouselApi: (api) => set({ carouselApi: api }),
  getRead: () => {
    const selector =
      '.grid > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div:nth-of-type(2) span';
    const element = document.querySelector(selector);
    return element?.firstChild?.nodeValue
      ? parseInt(element.firstChild.nodeValue, 10)
      : 0;
  },
  reset: () => {
    set({
      container: undefined,
      currentChapter: undefined,
      chapterContent: undefined,
      settings: {
        fullscreen: false,
        sortBy: {
          field: ReaderSortBy.Chapter,
          order: ReaderOrderBy.Ascending,
        },
      } as ReaderSettings,
      carouselApi: undefined,
    });
  },
}));

interface ReaderProviderProps extends PropsWithChildren {
  type: ReaderType;
  container: HTMLElement;
}

export const ReaderProvider: FC<ReaderProviderProps> = ({
  children,
  type,
  container,
}) => {
  const { initialize } = useReader();
  const { data } = useReadData(type);

  useEffect(() => {
    if (!data) return;

    initialize(type, data, container);
  }, [data]);

  return children;
};
