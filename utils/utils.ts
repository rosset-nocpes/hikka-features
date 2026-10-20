/** A Hikka title's name to show: Ukrainian first. */
export const hikkaTitle = (content: any): string | undefined =>
  content?.title_ua ||
  content?.title_en ||
  content?.title_ja ||
  content?.title_original;

/** A name without case and spaces, for matching and searching names. */
export const looseKey = (value: string) =>
  value.toLocaleLowerCase('uk').replace(/\s+/g, '');
