import { type FC, type PropsWithChildren, useEffect } from 'react';
import { create } from 'zustand';

import type { CarouselApi } from '@/components/ui/carousel';

import { queryClient } from '@/entrypoints/content';

import type {
  Chapter,
  MangaSettings,
  NovelSettings,
  ReaderContent,
  ReaderSettings,
} from '../reader.types';

import {
  MangaOrientation,
  NovelTheme,
  ReaderContentMode,
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
  getRead: () => number;
  reset: () => void;
}

const isTranslatorMatch = (chapter: Chapter, translator: string) =>
  !translator ||
  chapter.translator
    .split(',')
    .map((value) => value.trim())
    .includes(translator);

const getDateTime = (value: string) =>
  new Date(value.split('.').reverse().join('-')).getTime();

const sortChapters = (
  chapters: Chapter[],
  field: ReaderSortBy,
  order: ReaderOrderBy,
) => {
  const multiplier = order === ReaderOrderBy.Ascending ? 1 : -1;

  return [...chapters].sort((a, b) => {
    if (field === ReaderSortBy.Chapter) {
      return (a.chapter - b.chapter) * multiplier;
    }

    if (field === ReaderSortBy.DateUpload) {
      return (
        (getDateTime(a.date_upload) - getDateTime(b.date_upload)) * multiplier
      );
    }

    return 0;
  });
};

export const useReader = create<ReaderState & ReaderActions>((set, get) => ({
  settings: {
    fullscreen: false,
    sortBy: {
      field: ReaderSortBy.Chapter,
      order: ReaderOrderBy.Ascending,
    },
    translator: '',
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
      const chapters = data.chapters.filter((c) =>
        isTranslatorMatch(c, settings.translator),
      );
      const index = chapters.findIndex((c) => c.id === currentChapter.id);
      if (index === -1) return;
      const next = chapters[index + 1];
      if (!next) return;
      set({ currentChapter: next });
    }

    if (data.displayMode === ReaderContentMode.Volumes) {
      const allChapters = data.volumes
        .map((volume) => ({
          ...volume,
          chapters: sortChapters(
            volume.chapters.filter((c) =>
              isTranslatorMatch(c, settings.translator),
            ),
            settings.sortBy.field,
            settings.sortBy.order,
          ),
        }))
        .filter((volume) => volume.chapters.length > 0)
        .sort((a, b) => {
          if (settings.sortBy.field === ReaderSortBy.Chapter) {
            return (
              (a.number - b.number) *
              (settings.sortBy.order === ReaderOrderBy.Ascending ? 1 : -1)
            );
          }

          if (settings.sortBy.field === ReaderSortBy.DateUpload) {
            return (
              (getDateTime(a.chapters[0].date_upload) -
                getDateTime(b.chapters[0].date_upload)) *
              (settings.sortBy.order === ReaderOrderBy.Ascending ? 1 : -1)
            );
          }

          return 0;
        })
        .flatMap((volume) => volume.chapters);

      const index = allChapters.findIndex((c) => c.id === currentChapter.id);
      if (index === -1) return;
      const next = allChapters[index + 1];
      if (!next) return;
      set({ currentChapter: next });
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
      const chapters = data.chapters.filter((c) =>
        isTranslatorMatch(c, settings.translator),
      );
      const index = chapters.findIndex((c) => c.id === currentChapter.id);
      if (index === -1) return;
      const prev = chapters[index - 1];
      if (index <= 0 || !prev) return;
      set({ currentChapter: prev });
    }

    if (data.displayMode === ReaderContentMode.Volumes) {
      const allChapters = data.volumes
        .map((volume) => ({
          ...volume,
          chapters: sortChapters(
            volume.chapters.filter((c) =>
              isTranslatorMatch(c, settings.translator),
            ),
            settings.sortBy.field,
            settings.sortBy.order,
          ),
        }))
        .filter((volume) => volume.chapters.length > 0)
        .sort((a, b) => {
          if (settings.sortBy.field === ReaderSortBy.Chapter) {
            return (
              (a.number - b.number) *
              (settings.sortBy.order === ReaderOrderBy.Ascending ? 1 : -1)
            );
          }

          if (settings.sortBy.field === ReaderSortBy.DateUpload) {
            return (
              (getDateTime(a.chapters[0].date_upload) -
                getDateTime(b.chapters[0].date_upload)) *
              (settings.sortBy.order === ReaderOrderBy.Ascending ? 1 : -1)
            );
          }

          return 0;
        })
        .flatMap((volume) => volume.chapters);

      const index = allChapters.findIndex((c) => c.id === currentChapter.id);
      if (index === -1) return;
      const prev = allChapters[index - 1];
      if (index <= 0 || !prev) return;
      set({ currentChapter: prev });
    }
  },
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
      settings: {
        fullscreen: false,
        sortBy: {
          field: ReaderSortBy.Chapter,
          order: ReaderOrderBy.Ascending,
        },
        translator: '',
      } as ReaderSettings,
      carouselApi: undefined,
    });
  },
}));

interface ReaderProviderProps extends PropsWithChildren {
  container: HTMLElement;
}

export const ReaderProvider: FC<ReaderProviderProps> = ({
  children,
  container,
}) => {
  const { initialize } = useReader();
  const { data } = useReadData();
  const { contentType } = usePageStore();
  const typeFromContent = contentType
    ? contentType === 'manga'
      ? ReaderType.Manga
      : ReaderType.Novel
    : ReaderType.Manga;

  useEffect(() => {
    if (!data) return;

    initialize(typeFromContent, data, container);
  }, [data]);

  return children;
};
