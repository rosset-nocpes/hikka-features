/** A Hikka title's name to show: Ukrainian first. */
export const hikkaTitle = (content: any): string | undefined =>
  content?.title_ua ||
  content?.title_en ||
  content?.title_ja ||
  content?.title_original;

/** A name without case and spaces, for matching and searching names. */
export const looseKey = (value: string) =>
  value.toLocaleLowerCase('uk').replace(/\s+/g, '');

/** Ukrainian letters by their usual Latin spelling. */
const LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ie',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'iu',
  я: 'ia',
};

/**
 * A name in Latin letters with the spellings transliteration varies in
 * folded together, so "Гласс Мун" finds "Glass Moon". Mirrors the
 * backend's `latinKey`; only for comparing names.
 */
export const latinKey = (value: string) =>
  [...value.toLocaleLowerCase('uk')]
    .map((char) => LATIN[char] ?? char)
    .join('')
    .replace(/kh/g, 'h')
    .replace(/g/g, 'h')
    .replace(/q/g, 'k')
    .replace(/c/g, 'k')
    .replace(/w/g, 'v')
    .replace(/x/g, 'ks')
    .replace(/[yj]/g, 'i')
    .replace(/[^a-z0-9]/g, '');
