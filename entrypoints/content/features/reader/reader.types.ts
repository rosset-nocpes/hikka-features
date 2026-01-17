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

export type UISettingType =
  | 'boolean'
  | 'number'
  | 'slider'
  | 'select'
  | 'tabs'
  | 'text';

export interface UISettingMetadata {
  label: string;
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

export type KeysOfUnion<T> = T extends T ? keyof T : never;
export type BaseKeys = BaseReaderSettings | 'type';
