export {};

declare global {
  type MediaType = 'anime' | 'manga' | 'novel';

  type InfoType = 'character' | 'person';

  type SourcesType = 'mal' | 'anilist' | 'anidb' | 'ann' | 'wiki' | 'mu';

  type UserDataV2 = {
    hikkaId: string;
    username: string;
    description?: string;
    avatar: string;
  };
}
