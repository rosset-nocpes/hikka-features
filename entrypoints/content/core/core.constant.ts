import { HikkaPages } from './core.enums';

export const HIKKA_PAGE_CHECKERS: Record<
  HikkaPages,
  (path: string) => boolean
> = {
  [HikkaPages.All]: () => true,
  [HikkaPages.AnimeSearch]: (p) => p.endsWith('/anime'),
  [HikkaPages.AnimeContent]: (p) => p.startsWith('/anime/'),
  [HikkaPages.AnimeMainPage]: (p) => /^\/anime\/[\w-]+$/.test(p),
  [HikkaPages.MangaSearch]: (p) => p.endsWith('/manga'),
  [HikkaPages.MangaContent]: (p) => p.startsWith('/manga/'),
  [HikkaPages.MangaMainPage]: (p) => /^\/manga\/[\w-]+$/.test(p),
  [HikkaPages.NovelSearch]: (p) => p.endsWith('/novel'),
  [HikkaPages.NovelContent]: (p) => p.startsWith('/novel/'),
  [HikkaPages.NovelMainPage]: (p) => /^\/novel\/[\w-]+$/.test(p),
  [HikkaPages.EditContent]: (p) => p.startsWith('/edit/'),
  [HikkaPages.EditCreate]: (p) => p.startsWith('/edit/new'),
  [HikkaPages.EditCreateCharacter]: (p) =>
    p.startsWith('/edit/new') &&
    new URLSearchParams(location.search).get('content_type') === 'character',
  [HikkaPages.EditCreatePerson]: (p) =>
    p.startsWith('/edit/new') &&
    new URLSearchParams(location.search).get('content_type') === 'person',
};
