import type { ProviderIFrame, ProviderTeamIFrame } from './provider_classes';

declare global {
  namespace API {
    /* Anime */
    type WatchData = {
      type: 'tv' | 'movie' | 'ona';
      [key: string]: ProviderTeamIFrame | ProviderIFrame;
    };

    type NotionData = {
      poster?: string;
      fandub?: FandubTeam[];
    };

    type FandubTeam = {
      title: string;
      logo: string;
      link: string;
    };

    type ProviderData = {
      [key: string]: EpisodeData[];
    };

    type EpisodeData = {
      episode: number;
      video_url: string;
    };

    /* Manga */
    type ReadData = {
      chapters: ChapterData[];
    };

    type ChapterData = {
      id: string;
      scanlator: string;
      date_upload: string;
      volume: number;
      chapter: number;
      title: string;
      url: string;
    };

    type ReadChapterData = {
      images: string[];
    };

    type ScanlationGroup = {
      id: string;
      name: string;
      website: string;
      description: string;
    };

    type ChapterUser = {
      id: string;
      username: string;
    };

    /* New WatchData (need refactor, for now just fast hotfix for smaller bundle size) */
    type ProviderType = 'team-iframe' | 'team-hls' | 'iframe' | 'hls' | 'id';

    type TeamData = {
      title: string;
      logo: string;
    };

    type EpisodeDataIFrame = {
      episode: number;
      video_url: string;
    };

    interface EditorCharacters {
      suggestion: {
        name: string;
      };
    }
  }
}
