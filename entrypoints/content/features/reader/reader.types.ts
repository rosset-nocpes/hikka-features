import type { ForwardRefExoticComponent, SVGProps } from 'react';

import type {
  MangaOrientation,
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
interface BaseReaderSettings {
  fullscreen: boolean;
  sortBy: {
    field: ReaderSortBy;
    order: ReaderOrderBy;
  };
  translator: string;
}

export interface MangaSettings extends BaseReaderSettings {
  type: ReaderType.Manga;
  scale: number;
  orientation: MangaOrientation;
  scrollMode: boolean;
}

export interface NovelSettings extends BaseReaderSettings {
  type: ReaderType.Novel;
  fontSize: number;
  fontFamily: string;
  theme: NovelTheme;
}

export type ReaderSettings = MangaSettings | NovelSettings;

type UISettingType = 'boolean' | 'slider' | 'select' | 'tabs';

export interface UISettingMetadata {
  label: string;
  description?: string;
  type: UISettingType;
  min?: number;
  max?: number;
  options?: {
    value: string;
    label?: string;
    icon?: ForwardRefExoticComponent<
      SVGProps<SVGSVGElement> & { title?: string | undefined }
    >;
  }[];
}

type KeysOfUnion<T> = T extends T ? keyof T : never;

/** The settings of one reader type, which the settings menu lists. */
export type SettingKey = Exclude<
  KeysOfUnion<ReaderSettings>,
  keyof BaseReaderSettings | 'type'
>;
