import MaterialSymbolsViewAgendaOutline from '~icons/material-symbols/view-agenda-outline';
import MaterialSymbolsViewColumn2Outline from '~icons/material-symbols/view-column-2-outline';

import { BAKA_IN_UA_URL, MANGA_IN_UA_URL } from '@/constants/links';

import type { SettingKey, UISettingMetadata } from './reader.types';

import { MangaOrientation, NovelTheme } from './reader.enums';

export const SETTINGS_CONFIG: Partial<Record<SettingKey, UISettingMetadata>> = {
  // Manga
  orientation: {
    label: 'Орієнтація',
    description: 'Напрямок гортання сторінок',
    type: 'tabs',
    options: [
      {
        value: MangaOrientation.Horizontal,
        label: 'Горизонтально',
        icon: MaterialSymbolsViewColumn2Outline,
      },
      {
        value: MangaOrientation.Vertical,
        label: 'Вертикально',
        icon: MaterialSymbolsViewAgendaOutline,
      },
    ],
  },
  scrollMode: {
    label: 'Режим скролу',
    description: 'Безперервна стрічка сторінок, як у манхві',
    type: 'boolean',
  },
  // Novel
  fontFamily: {
    label: 'Шрифт',
    description: 'Гарнітура тексту розділу',
    type: 'select',
    options: [
      { value: 'font-sans', label: 'Geist' },
      { value: 'font-nunitosans', label: 'Nunito Sans' },
      { value: 'font-roboto', label: 'Roboto' },
      { value: 'font-literata', label: 'Literata' },
      { value: 'font-ebgaramond', label: 'EB Garamond' },
    ],
  },
  fontSize: {
    label: 'Розмір шрифту',
    type: 'slider',
    min: 12,
    max: 24,
  },
  theme: {
    label: 'Тема',
    description: 'Кольори сторінки читалки',
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
  manga: { label: 'Powered by Manga.in.ua', url: MANGA_IN_UA_URL },
  novel: { label: 'Powered by Baka.in.ua', url: BAKA_IN_UA_URL },
};

/** How the reader's pages and loading states come and go. */
export const FADE_BLUR = {
  initial: { opacity: 0 },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(16px)' },
  transition: { duration: 0.2 },
};

// Loading pages

/** Retries a page image gets, the first wait between them doubling each time. */
export const MAX_IMAGE_RETRIES = 3;
export const IMAGE_RETRY_DELAY_MS = 1_000;

// Zooming into images

/** How much a zoom button or key scales by, and what a double tap zooms to. */
export const ZOOM_STEP = 1.5;
export const DOUBLE_TAP_SCALE = 2.5;

/** How far an image can be zoomed out and in. */
export const MIN_SCALE = 1;
export const MAX_SCALE = 8;

/** How far a pointer moves before a tap becomes a drag. */
export const PAN_DRAG_THRESHOLD = 4;

/** How much of the viewport an opened image fills at most. */
export const VIEWPORT_FILL = 0.9;
