import { BAKA_IN_UA_URL, MANGA_IN_UA_URL } from '@/constants/links';

import type { SettingOption } from './reader.types';

import {
  MangaBackground,
  MangaReadingMode,
  NovelTextWidth,
  NovelTheme,
} from './reader.enums';

export const READING_MODES: SettingOption<MangaReadingMode>[] = [
  {
    value: MangaReadingMode.LeftToRight,
    label: 'Зліва направо',
    description: 'Сторінки гортаються праворуч, як у коміксах',
  },
  {
    value: MangaReadingMode.RightToLeft,
    label: 'Справа наліво',
    description: 'Сторінки гортаються ліворуч, як у японській манзі',
  },
  {
    value: MangaReadingMode.Vertical,
    label: 'Вертикально',
    description: 'Сторінки гортаються донизу, по одній',
  },
  {
    value: MangaReadingMode.Strip,
    label: 'Стрічка',
    description: 'Усі сторінки однією безперервною стрічкою',
  },
];

/** Each background with the text colour that reads on it. */
export const MANGA_BACKGROUNDS: (SettingOption<MangaBackground> & {
  className: string;
})[] = [
  { value: MangaBackground.Theme, label: 'Як у теми', className: 'bg-card' },
  {
    value: MangaBackground.Black,
    label: 'Чорний',
    className: 'bg-black text-white',
  },
  {
    value: MangaBackground.Gray,
    label: 'Сірий',
    className: 'bg-neutral-600 text-white',
  },
  {
    value: MangaBackground.White,
    label: 'Білий',
    className: 'bg-white text-neutral-950',
  },
];

/** The strip's width bounds and how much a zoom button changes it, in %. */
export const STRIP_WIDTH = { min: 25, max: 100, step: 5 };

export const NOVEL_FONTS: SettingOption[] = [
  { value: 'font-sans', label: 'Geist' },
  { value: 'font-nunitosans', label: 'Nunito Sans' },
  { value: 'font-roboto', label: 'Roboto' },
  { value: 'font-literata', label: 'Literata' },
  { value: 'font-ebgaramond', label: 'EB Garamond' },
];

export const NOVEL_FONT_SIZE = { min: 12, max: 28, step: 1 };
export const NOVEL_LINE_HEIGHT = { min: 1.3, max: 2.2, step: 0.05 };

export const NOVEL_THEMES: SettingOption<NovelTheme>[] = [
  { value: NovelTheme.Light, label: 'Світла' },
  { value: NovelTheme.Sepia, label: 'Сепія' },
  { value: NovelTheme.Slate, label: 'Сліт' },
  { value: NovelTheme.Dark, label: 'Темна' },
  { value: NovelTheme.Black, label: 'Чорна' },
];

/** Each width with the column's widest, in ems so it grows with the text. */
export const NOVEL_TEXT_WIDTHS: (SettingOption<NovelTextWidth> & {
  maxWidth: string;
})[] = [
  { value: NovelTextWidth.Narrow, label: 'Вузька', maxWidth: '34em' },
  { value: NovelTextWidth.Medium, label: 'Середня', maxWidth: '42em' },
  { value: NovelTextWidth.Wide, label: 'Широка', maxWidth: '56em' },
];

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

// Saving settings

/** How long settings wait after a change to be saved, so a drag saves once. */
export const PREFERENCES_SAVE_DELAY_MS = 300;

// Loading pages

/** Retries a page image gets, the first wait between them doubling each time. */
export const MAX_IMAGE_RETRIES = 3;
export const IMAGE_RETRY_DELAY_MS = 1_000;

/** Pages this much taller than wide are a long strip's, as manhwa has. */
export const LONG_PAGE_RATIO = 3.5;

/** The chapter's first pages, loaded to tell whether its pages are long. */
export const LONG_PAGE_SAMPLE = 3;

// Turning and scrolling

/** How much of the page's width at either side turns it on a tap. */
export const TAP_TURN_ZONE = 0.3;

/** Shares of the strip's height an arrow key and a page key scroll by. */
export const STRIP_ARROW_SCROLL = 0.2;
export const STRIP_PAGE_SCROLL = 0.85;

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
