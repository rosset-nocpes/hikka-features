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

  type BackendBranches = 'stable' | 'localhost';

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
    provider: string;
    team: string;
    episodeData: API.EpisodeData[];
    currentEpisode: API.EpisodeData;
    sidebarMode: 'offcanvas' | 'icon';
    container: HTMLElement;
  }

  interface NovelChapter {
    id: string;
    chapter: number;
    volume?: number;
    title: string;
    translator: string;
    date_upload: string;
    url: string;
  }

  interface NovelVolume {
    number: number;
    chapters: (NovelChapter & { volume: number })[];
  }

  type NovelContent =
    | {
        displayMode: 'volumes';
        volumes: NovelVolume[];
      }
    | {
        displayMode: 'chapters';
        chapters: NovelChapter[];
      };
}
