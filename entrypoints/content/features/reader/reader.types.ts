import type {
  MangaBackground,
  MangaReadingMode,
  NovelTextWidth,
  NovelTheme,
  ReaderContentMode,
  ReaderOrderBy,
  ReaderSortBy,
  ReaderType,
} from './reader.enums';

export interface Chapter {
  id: string;
  volume?: number;
  chapter: number;
  title: string;
  translator: string;
  date_upload: string;
  url: string;
}

/** What a source searches by: the title's hikka.io record. */
export interface TitleInfo {
  title_ua?: string | null;
  title_en?: string | null;
  title_original?: string | null;
  year?: number | null;
  external?: { text: string; url: string }[];
}

export interface Volume {
  number: number;
  chapters: Chapter[];
}

export type ReaderContent =
  | {
      displayMode: ReaderContentMode.Volumes;
      volumes: Volume[];
    }
  | {
      displayMode: ReaderContentMode.Chapters;
      chapters: Chapter[];
    };

/*
 * Settings
 */
export interface SortBy {
  field: ReaderSortBy;
  order: ReaderOrderBy;
}

interface BaseReaderSettings {
  fullscreen: boolean;
  sortBy: SortBy;
  /** Only this translator's chapters, or everyone's when empty. */
  translator: string;
  /** Asks the device not to dim or lock its screen while the reader is open. */
  keepAwake: boolean;
}

export interface MangaPreferences {
  readingMode: MangaReadingMode;
  /** Chapters of long strips open as a strip whatever the mode. */
  autoStrip: boolean;
  /** Two pages side by side when paging sideways on wide screens. */
  doublePage: boolean;
  /** The first page stays alone in double pages, as a book's cover does. */
  coverAlone: boolean;
  /** The strip's width, in percent of the reader's. */
  stripWidth: number;
  /** Space between the strip's pages. */
  stripGaps: boolean;
  background: MangaBackground;
  /** A click or tap at a side of the page turns it. */
  tapToTurn: boolean;
  showPageNumber: boolean;
}

export interface NovelPreferences {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  textWidth: NovelTextWidth;
  justify: boolean;
  theme: NovelTheme;
}

export interface MangaSettings extends BaseReaderSettings, MangaPreferences {
  type: ReaderType.Manga;
}

export interface NovelSettings extends BaseReaderSettings, NovelPreferences {
  type: ReaderType.Novel;
}

export type ReaderSettings = MangaSettings | NovelSettings;

/** A choice among a setting's values, as its picker shows it. */
export interface SettingOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}
