import type {
  MangaOrientation,
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
export interface BaseReaderSettings {
  fullscreen: boolean;
  sortBy: {
    field: ReaderSortBy;
    order: ReaderOrderBy;
  };
}

export interface MangaSettings extends BaseReaderSettings {
  type: ReaderType.Manga;
  scale: number; // maybe move it to base settings
  scrollMode: boolean;
  orientation: MangaOrientation;
}

export interface NovelSettings extends BaseReaderSettings {
  type: ReaderType.Novel;
  fontSize: number;
  fontFamily: string;
}

export type ReaderSettings = MangaSettings | NovelSettings;
