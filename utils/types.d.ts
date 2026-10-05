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

  interface PlayerState {
    provider: string;
    team: string;
    episodeData: API.EpisodeData[];
    currentEpisode: API.EpisodeData;
    sidebarMode: 'offcanvas' | 'icon';
    container: HTMLElement;
  }
}
