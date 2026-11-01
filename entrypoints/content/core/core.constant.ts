import {
  isRecommendationsPagePath,
  isTeamPagePath,
} from '@/utils/hikka-router';

import { HikkaPages } from './core.enums';

/** `/edit/new`, `/edit/<id>` and `/edit/<id>/update`. */
export const EDIT_FORM_PATH = /^\/edit\/(?:new|(\d+)(\/update)?)\/?$/;

/** A new edit's page for content of `contentType`. */
const isNewEdit = (path: string, contentType: string) =>
  path.startsWith('/edit/new') &&
  new URLSearchParams(location.search).get('content_type') === contentType;

export const HIKKA_PAGE_CHECKERS: Record<
  HikkaPages,
  (path: string) => boolean
> = {
  [HikkaPages.All]: () => true,
  [HikkaPages.Home]: (p) => p === '/',
  [HikkaPages.AllContent]: (p) => /^\/(anime|manga|novel)\//.test(p),
  [HikkaPages.AnimeContent]: (p) => p.startsWith('/anime/'),
  [HikkaPages.AnimeMainPage]: (p) => /^\/anime\/[\w-]+$/.test(p),
  [HikkaPages.MangaContent]: (p) => p.startsWith('/manga/'),
  [HikkaPages.MangaMainPage]: (p) => /^\/manga\/[\w-]+$/.test(p),
  [HikkaPages.NovelContent]: (p) => p.startsWith('/novel/'),
  [HikkaPages.NovelMainPage]: (p) => /^\/novel\/[\w-]+$/.test(p),
  [HikkaPages.TeamPages]: isTeamPagePath,
  [HikkaPages.RecommendationsPage]: isRecommendationsPagePath,
  [HikkaPages.EditContent]: (p) => p.startsWith('/edit/'),
  [HikkaPages.EditCreateCharacter]: (p) => isNewEdit(p, 'character'),
  [HikkaPages.EditCreatePerson]: (p) => isNewEdit(p, 'person'),
  [HikkaPages.EditForm]: (p) => EDIT_FORM_PATH.test(p),
};
