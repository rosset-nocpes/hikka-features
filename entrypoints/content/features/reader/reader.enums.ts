export enum ReaderType {
  Manga = 'manga',
  Novel = 'novel',
}

export enum ReaderContentMode {
  Chapters = 'chapters',
  Volumes = 'volumes',
}

export enum ReaderSortBy {
  Chapter = 'chapter',
  DateUpload = 'date_upload',
}

export enum ReaderOrderBy {
  Ascending = 'asc',
  Descending = 'desc',
}

/** How manga pages follow each other. */
export enum MangaReadingMode {
  /** One page at a time, turned to the right. */
  LeftToRight = 'ltr',
  /** One page at a time, turned to the left, as Japanese manga is read. */
  RightToLeft = 'rtl',
  /** One page at a time, turned downwards. */
  Vertical = 'vertical',
  /** Every page in one scrolled column, as manhwa is read. */
  Strip = 'strip',
}

/** What shows round manga pages. */
export enum MangaBackground {
  /** The reader's own card colour. */
  Theme = 'theme',
  Black = 'black',
  Gray = 'gray',
  White = 'white',
}

/** How wide a novel's text column is at most. */
export enum NovelTextWidth {
  Narrow = 'narrow',
  Medium = 'medium',
  Wide = 'wide',
}

export enum NovelTheme {
  Light = 'novel-theme-light',
  Sepia = 'novel-theme-sepia',
  Slate = 'novel-theme-slate',
  Dark = 'novel-theme-dark',
  Black = 'novel-theme-black',
}
