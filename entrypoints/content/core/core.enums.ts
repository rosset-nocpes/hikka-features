export enum HikkaPages {
  All = 'all',
  Home = 'home',
  AllContent = 'all-content',
  AnimeContent = 'anime-content',
  AnimeMainPage = 'anime-main-page',
  MangaContent = 'manga-content',
  MangaMainPage = 'manga-main-page',
  NovelContent = 'novel-content',
  NovelMainPage = 'novel-main-page',
  CharacterPage = 'character-page',
  PersonPage = 'person-page',
  /** A user's profile, `/u/<username>`. */
  UserPage = 'user-page',
  // The extension's own pages
  TeamPages = 'team-pages',
  RecommendationsPage = 'recommendations-page',
  EditContent = 'edit-content',
  /** An edit's own page, `/edit/<id>`. */
  EditPage = 'edit-page',
  EditCreateCharacter = 'edit-create-character',
  EditCreatePerson = 'edit-create-person',
  /** A new edit, an edit, or an edit being changed: the pages with its form. */
  EditForm = 'edit-form',
}
