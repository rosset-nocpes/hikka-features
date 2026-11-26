import { STORAGE_KEYS } from '@/constants/storage';
import { StoredValue } from '@/utils/stored-value';

import type {
  MangaPreferences,
  NovelPreferences,
  ReaderSettings,
  SortBy,
} from './reader.types';

import {
  NOVEL_FONT_SIZE,
  NOVEL_LINE_HEIGHT,
  STRIP_WIDTH,
} from './reader.constants';
import {
  MangaBackground,
  MangaReadingMode,
  NovelTextWidth,
  NovelTheme,
  ReaderOrderBy,
  ReaderSortBy,
  ReaderType,
} from './reader.enums';

export const MANGA_DEFAULTS: MangaPreferences = {
  readingMode: MangaReadingMode.Vertical,
  autoStrip: true,
  doublePage: false,
  coverAlone: true,
  stripWidth: 50,
  stripGaps: false,
  background: MangaBackground.Theme,
  tapToTurn: true,
  showPageNumber: true,
};

export const NOVEL_DEFAULTS: NovelPreferences = {
  fontFamily: 'font-sans',
  fontSize: 16,
  lineHeight: 1.75,
  textWidth: NovelTextWidth.Medium,
  justify: false,
  theme: NovelTheme.Dark,
};

export const TYPE_DEFAULTS = {
  [ReaderType.Manga]: MANGA_DEFAULTS,
  [ReaderType.Novel]: NOVEL_DEFAULTS,
};

/** What both readers keep, whichever type is open. */
export const SHARED_DEFAULTS = {
  sortBy: {
    field: ReaderSortBy.Chapter,
    order: ReaderOrderBy.Ascending,
  } as SortBy,
  keepAwake: true,
};

/** Every reader's choices, kept across visits and tabs. */
interface StoredPreferences {
  manga?: Partial<MangaPreferences>;
  novel?: Partial<NovelPreferences>;
  sortBy?: SortBy;
  keepAwake?: boolean;
}

const stored = new StoredValue<StoredPreferences>(STORAGE_KEYS.readerSettings);

/** Settings waiting to be saved, the timer saving them, the save under way. */
let pending: ReaderSettings | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let saving: Promise<void> = Promise.resolve();

/** The values settings of an enum can take. */
const ENUM_VALUES: Record<string, string[]> = {
  readingMode: Object.values(MangaReadingMode),
  background: Object.values(MangaBackground),
  textWidth: Object.values(NovelTextWidth),
  theme: Object.values(NovelTheme),
  field: Object.values(ReaderSortBy),
  order: Object.values(ReaderOrderBy),
};

/** The bounds of numeric settings, which their sliders keep to. */
const RANGES: Record<string, { min: number; max: number }> = {
  stripWidth: STRIP_WIDTH,
  fontSize: NOVEL_FONT_SIZE,
  lineHeight: NOVEL_LINE_HEIGHT,
};

/**
 * `saved` over `defaults`, key by key, skipping what another version stored
 * as another type or value, and keeping numbers in their bounds.
 */
const over = <T extends object>(defaults: T, saved: Partial<T> = {}): T =>
  Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => {
      const kept: unknown = saved[key as keyof T];
      const valid =
        typeof kept === typeof value &&
        (ENUM_VALUES[key]?.includes(kept as string) ?? true) &&
        (typeof kept !== 'number' || Number.isFinite(kept));
      if (!valid) return [key, value];

      const range = RANGES[key];
      return [
        key,
        range ? Math.min(Math.max(kept as number, range.min), range.max) : kept,
      ];
    }),
  ) as T;

/** Both readers' saved settings, defaults where none are. */
export interface Preferences {
  manga: MangaPreferences;
  novel: NovelPreferences;
  sortBy: SortBy;
  keepAwake: boolean;
}

const read = async () =>
  (await stored.get().catch(() => undefined)) ?? ({} as StoredPreferences);

/** Every saved setting, after any change still waiting to be saved. */
export const readPreferences = async (): Promise<Preferences> => {
  // A change made just before the reader last closed is saved first.
  clearTimeout(timer);
  await flush();
  const saved = await read();
  return {
    manga: over(MANGA_DEFAULTS, saved.manga),
    novel: over(NOVEL_DEFAULTS, saved.novel),
    sortBy: over(SHARED_DEFAULTS.sortBy, saved.sortBy),
    keepAwake: over(SHARED_DEFAULTS, saved).keepAwake,
  };
};

/** The saved settings of a `type` reader, defaults where none are. */
export const loadPreferences = async (type: ReaderType) => {
  const { sortBy, keepAwake, ...types } = await readPreferences();
  return { ...types[type], sortBy, keepAwake };
};

/** Some settings to save, as the extension's popup changes them. */
export interface PreferencesChange {
  manga?: Partial<MangaPreferences>;
  novel?: Partial<NovelPreferences>;
  keepAwake?: boolean;
}

/** Saves `change` over the saved settings, in turn with other saves. */
export const changePreferences = (change: PreferencesChange) => {
  saving = saving
    .then(async () => {
      const saved = await read();
      await stored.set({
        ...saved,
        ...(change.manga && { manga: { ...saved.manga, ...change.manga } }),
        ...(change.novel && { novel: { ...saved.novel, ...change.novel } }),
        ...(change.keepAwake !== undefined && { keepAwake: change.keepAwake }),
      });
    })
    .catch((error) => console.error('Failed to save reader settings:', error));
  return saving;
};

/** Puts both readers' settings back as they first were, but not the sort. */
export const resetReaderPreferences = () =>
  changePreferences({
    manga: MANGA_DEFAULTS,
    novel: NOVEL_DEFAULTS,
    keepAwake: SHARED_DEFAULTS.keepAwake,
  });

/** Calls `listener` whenever any context saves the settings. */
export const followPreferences = (listener: () => void) =>
  stored.watch(() => listener());

/** Whether a change here is still waiting to be saved. */
export const hasUnsavedPreferences = () => pending !== undefined;

/** Writes what `settings` keep; a slider's drag writes once, at its end. */
export const savePreferences = (settings: ReaderSettings) => {
  pending = settings;
  clearTimeout(timer);
  timer = setTimeout(() => void flush(), 300);
};

/**
 * Saves the pending settings after any save still under way, so saves land
 * in order and a load after this one reads them.
 */
const flush = () => {
  const settings = pending;
  pending = undefined;
  saving = saving
    .then(() => write(settings))
    .catch((error) => console.error('Failed to save reader settings:', error));
  return saving;
};

const write = async (settings: ReaderSettings | undefined) => {
  if (!settings?.type) return;

  const defaults: object = TYPE_DEFAULTS[settings.type];
  const typeSettings = Object.fromEntries(
    Object.keys(defaults).map((key) => [
      key,
      settings[key as keyof ReaderSettings],
    ]),
  );
  const saved = await read();
  await stored.set({
    ...saved,
    [settings.type]: typeSettings,
    sortBy: settings.sortBy,
    keepAwake: settings.keepAwake,
  });
};
