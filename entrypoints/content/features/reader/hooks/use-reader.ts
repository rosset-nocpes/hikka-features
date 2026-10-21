import { type FC, type PropsWithChildren, useEffect } from 'react';
import { create } from 'zustand';

import type { CarouselApi } from '@/components/ui/carousel';

import { hikkaTracker } from '@/utils/hikka-tracker';

import type {
  Chapter,
  MangaSettings,
  NovelSettings,
  ReaderContent,
  ReaderSettings,
} from '../reader.types';

import { queryClient } from '../../../core/query-client';
import { adjacentChapter, allChapters } from '../chapters';
import {
  MangaOrientation,
  NovelTheme,
  ReaderOrderBy,
  ReaderSortBy,
  ReaderType,
} from '../reader.enums';
import useReadData from './use-read-data';

export interface ReaderState {
  /* Base */
  container?: HTMLElement;
  /* Reader-related */
  currentChapter?: Chapter;
  settings: ReaderSettings;
  /* Manga-related (idk where to put it for now) */
  carouselApi?: CarouselApi;
  /** Phones hide the reader's bars on a tap at the page. */
  barsHidden: boolean;
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
  setSettings: (settings: Partial<ReaderSettings>) => void;
  toggleFullscreen: () => Promise<void>;
  syncFullscreen: (val: boolean) => void;
  setCarouselApi: (api: CarouselApi) => void;
  toggleBars: () => void;
  reset: () => void;
}

const baseSettings = (): ReaderSettings =>
  ({
    fullscreen: false,
    sortBy: { field: ReaderSortBy.Chapter, order: ReaderOrderBy.Ascending },
    translator: '',
  }) as ReaderSettings;

const TYPE_SETTINGS = {
  [ReaderType.Manga]: {
    scale: 1,
    orientation: MangaOrientation.Vertical,
    scrollMode: false,
  },
  [ReaderType.Novel]: {
    fontFamily: 'font-sans',
    fontSize: 16,
    theme: NovelTheme.Dark,
  },
} satisfies {
  [ReaderType.Manga]: Partial<MangaSettings>;
  [ReaderType.Novel]: Partial<NovelSettings>;
};

export const useReader = create<ReaderState & ReaderActions>((set, get) => {
  /** Opens `chapter` on its first page. */
  const showChapter = (chapter: Chapter) => {
    set({ currentChapter: chapter });
    get().carouselApi?.scrollTo(0, true);
  };

  /** Moves `offset` chapters along in reading order. */
  const step = (offset: 1 | -1) => {
    const { settings, currentChapter } = get();
    const { slug } = usePageStore.getState();
    const data = queryClient.getQueryData<ReaderContent>([
      'read-data',
      settings.type,
      slug,
    ]);
    const chapter = adjacentChapter(
      data,
      settings.translator,
      currentChapter,
      offset,
    );
    if (chapter) showChapter(chapter);
  };

  return {
    settings: baseSettings(),
    barsHidden: false,

    initialize: (type, data, container) => {
      const chapters = allChapters(data);
      set((state) => ({
        settings: {
          ...state.settings,
          type,
          ...TYPE_SETTINGS[type],
        } as ReaderSettings,
        // Where the user's progress on hikka.io stops.
        currentChapter: chapters[hikkaTracker.progress] ?? chapters[0],
        container,
      }));
    },
    setChapter: showChapter,
    nextChapter: () => step(1),
    prevChapter: () => step(-1),
    setSettings: (settings) =>
      set((state) => ({
        settings: { ...state.settings, ...settings } as ReaderSettings,
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
    toggleBars: () => set({ barsHidden: !get().barsHidden }),
    reset: () =>
      set({
        container: undefined,
        currentChapter: undefined,
        settings: baseSettings(),
        carouselApi: undefined,
        barsHidden: false,
      }),
  };
});

interface ReaderProviderProps extends PropsWithChildren {
  container: HTMLElement;
}

/** Opens the reader on the chapter list once it's loaded. */
export const ReaderProvider: FC<ReaderProviderProps> = ({
  children,
  container,
}) => {
  const { data } = useReadData();
  const type = usePageStore((state) =>
    state.contentType === 'novel' ? ReaderType.Novel : ReaderType.Manga,
  );

  useEffect(() => {
    if (data) useReader.getState().initialize(type, data, container);
  }, [data, type, container]);

  return children;
};
