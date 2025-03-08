export {};

declare global {
  type MediaType = 'anime' | 'manga' | 'novel';

  type InfoType = 'character' | 'person';

  type SourcesType =
    | 'mal'
    | 'anilist'
    | 'anidb'
    | 'ann'
    | 'wiki'
    | 'amanogawa'
    | 'mu';
  // | "dengeki"

  type PlayerSource = 'moon' | 'ashdi';

  type PlayerData = PlayerSource | 'type';

  type BackendBranches = 'stable' | 'beta' | 'localhost';

  type UserDataV1 = {
    username: string;
    description?: string;
    avatar: string;
  };

  type UserDataV2 = {
    hikkaId: string;
    username: string;
    description?: string;
    avatar: string;
  };

  type HikkaSecretV1 = {
    secret: string;
    expiration: number;
  };

  type MangaScanlationGroup = {
    id: string;
    name: string;
    website: string;
    description: string;
  };

  type MangaUser = {
    id: string;
    username: string;
  };

  type ChapterDataEntry = {
    id: string;
    volume: number;
    chapter: number;
    title: string;
    pages: number;
    scanlation_groups: MangaScanlationGroup[];
    users: MangaUser[];
  };

  interface PlayerState {
    provider: PlayerSource;
    team: string;
    episodeData: API.EpisodeData[];
    currentEpisode: API.EpisodeData;
  }

  interface ReaderState {
    chapterData: API.ChapterData;
    images: string[];
  }
}
