import { type FC, type PropsWithChildren, useEffect } from 'react';
import { create } from 'zustand';

import type { CarouselApi } from '@/components/ui/carousel';

import { hikkaTracker } from '@/utils/hikka-tracker';

import type { Chapter, ReaderContent, ReaderSettings } from '../reader.types';

import { queryClient } from '../../../core/query-client';
import { adjacentChapter, allChapters } from '../chapters';
import { MangaReadingMode, ReaderType } from '../reader.enums';
import {
  loadPreferences,
  SHARED_DEFAULTS,
  savePreferences,
  TYPE_DEFAULTS,
} from '../reader.preferences';
import useReadData from './use-read-data';

interface ReaderState {
  /** What the reader is mounted in, where its popups portal to. */
  container?: HTMLElement;
  currentChapter?: Chapter;
  settings: ReaderSettings;
  /** The manga carousel, while one is shown. */
  carouselApi?: CarouselApi;
  /** Phones hide the reader's bars on a tap at the page. */
  barsHidden: boolean;
  /** The open chapter's pages are long strips, as a manhwa's are. */
  longPages: boolean;
  /** A mode was picked since the reader opened, so long pages keep it. */
  modePicked: boolean;
  /** The page at the middle of the strip, while one is shown. */
  stripPage: number;
  /** Pages of the open chapter wider than tall: spreads, shown alone. */
  widePages: ReadonlySet<number>;
}

interface ReaderActions {
  initialize: (
    type: ReaderType,
    data: ReaderContent,
    container: HTMLElement,
  ) => Promise<void>;
  setChapter: (chapter: Chapter) => void;
  nextChapter: () => void;
  prevChapter: () => void;
  setSettings: (settings: Partial<ReaderSettings>) => void;
  /** Picks how manga reads, over what its pages would pick. */
  pickReadingMode: (mode: MangaReadingMode) => void;
  /** Puts the settings menu's choices back as they first were. */
  resetSettings: () => void;
  /** Turns the manga page forwards (1) or back (-1) in reading order. */
  turnPage: (offset: 1 | -1) => void;
  toggleFullscreen: () => Promise<void>;
  syncFullscreen: (val: boolean) => void;
  setCarouselApi: (api: CarouselApi) => void;
  setLongPages: (long: boolean) => void;
  setStripPage: (page: number) => void;
  markWidePage: (page: number) => void;
  toggleBars: () => void;
  reset: () => void;
}

const baseSettings = (): ReaderSettings =>
  ({
    fullscreen: false,
    translator: '',
    ...SHARED_DEFAULTS,
  }) as ReaderSettings;

/** How manga is read now: as picked, or as a strip for long pages. */
export const mangaMode = (state: ReaderState) => {
  const { settings } = state;
  if (settings.type !== ReaderType.Manga) return undefined;
  return settings.autoStrip && state.longPages && !state.modePicked
    ? MangaReadingMode.Strip
    : settings.readingMode;
};

/** Whether manga pages turn sideways, either way. */
export const isSideways = (mode: MangaReadingMode | undefined) =>
  mode === MangaReadingMode.LeftToRight ||
  mode === MangaReadingMode.RightToLeft;

export const useReader = create<ReaderState & ReaderActions>((set, get) => {
  /** Counts the reader's openings, so a late load can't fill a closed one. */
  let opening = 0;

  /** Opens `chapter` on its first page. */
  const showChapter = (chapter: Chapter) => {
    set({ currentChapter: chapter, stripPage: 0, widePages: new Set() });
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

  const setSettings = (settings: Partial<ReaderSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...settings } as ReaderSettings,
    }));
    savePreferences(get().settings);
  };

  return {
    settings: baseSettings(),
    barsHidden: false,
    longPages: false,
    modePicked: false,
    stripPage: 0,
    widePages: new Set(),

    initialize: async (type, data, container) => {
      const current = ++opening;
      const preferences = await loadPreferences(type);
      if (current !== opening) return;

      const chapters = allChapters(data);
      set((state) => ({
        settings: {
          ...state.settings,
          type,
          ...preferences,
        } as ReaderSettings,
        // Where the user's progress on hikka.io stops.
        currentChapter: chapters[hikkaTracker.progress] ?? chapters[0],
        container,
      }));
    },
    setChapter: showChapter,
    nextChapter: () => step(1),
    prevChapter: () => step(-1),
    setSettings,
    pickReadingMode: (readingMode) => {
      set({ modePicked: true });
      setSettings({ readingMode });
    },
    resetSettings: () => {
      const { type } = get().settings;
      if (!type) return;
      set({ modePicked: false });
      setSettings({
        ...TYPE_DEFAULTS[type],
        keepAwake: SHARED_DEFAULTS.keepAwake,
      });
    },
    turnPage: (offset) => {
      const api = get().carouselApi;
      if (offset === 1) api?.scrollNext();
      else api?.scrollPrev();
    },
    toggleFullscreen: async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        } else {
          await document.exitFullscreen();
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
    setLongPages: (longPages) => set({ longPages }),
    setStripPage: (stripPage) => set({ stripPage }),
    markWidePage: (page) => {
      const { widePages } = get();
      if (!widePages.has(page))
        set({ widePages: new Set(widePages).add(page) });
    },
    toggleBars: () => set({ barsHidden: !get().barsHidden }),
    reset: () => {
      opening++;
      set({
        container: undefined,
        currentChapter: undefined,
        settings: baseSettings(),
        carouselApi: undefined,
        barsHidden: false,
        longPages: false,
        modePicked: false,
        stripPage: 0,
        widePages: new Set(),
      });
    },
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
    if (data) void useReader.getState().initialize(type, data, container);
  }, [data, type, container]);

  return children;
};
