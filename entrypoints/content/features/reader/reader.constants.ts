import MaterialSymbolsViewAgendaOutline from '~icons/material-symbols/view-agenda-outline';
import MaterialSymbolsViewColumn2Outline from '~icons/material-symbols/view-column-2-outline';
import { MangaOrientation, NovelTheme } from './reader.enums';
import type {
  BaseKeys,
  KeysOfUnion,
  ReaderSettings as ReaderSettingsType,
  UISettingMetadata,
} from './reader.types';

export const SETTINGS_CONFIG: Partial<
  Record<Exclude<KeysOfUnion<ReaderSettingsType>, BaseKeys>, UISettingMetadata>
> = {
  // Manga
  orientation: {
    label: 'Орієнтація',
    type: 'tabs',
    options: [
      {
        value: MangaOrientation.Horizontal,
        icon: MaterialSymbolsViewColumn2Outline,
      },
      {
        value: MangaOrientation.Vertical,
        icon: MaterialSymbolsViewAgendaOutline,
      },
    ],
  },
  scrollMode: { label: 'Режим скролу', type: 'boolean' },
  // Novel
  fontFamily: {
    label: 'Шрифт',
    type: 'select',
    options: [
      { value: 'font-sans', label: 'Geist' },
      { value: 'font-nunitosans', label: 'Nunito Sans' },
      { value: 'font-roboto', label: 'Roboto' },
      { value: 'font-literata', label: 'Literata' },
      { value: 'font-ebgaramond', label: 'EB Garamond' },
    ],
  },
  fontSize: { label: 'Розмір шрифту', type: 'slider', min: 12, max: 24 },
  theme: {
    label: 'Тема',
    type: 'select',
    options: [
      { value: NovelTheme.Light, label: 'Світла' },
      { value: NovelTheme.Sepia, label: 'Сепія' },
      { value: NovelTheme.Slate, label: 'Сліт' },
      { value: NovelTheme.Dark, label: 'Темна' },
      { value: NovelTheme.Black, label: 'Чорна' },
    ],
  },
};

export const READER_POWERED_BY = {
  manga: { label: 'Powered by Manga.in.ua', url: 'https://manga.in.ua' },
  novel: { label: 'Powered by Baka.in.ua', url: 'https://baka.in.ua' },
};
