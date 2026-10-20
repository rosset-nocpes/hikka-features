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

    type EpisodeData = {
      episode: number;
      video_url: string;
      title?: {
        ua?: string;
        en?: string;
        ja?: string;
      };
      releasedAt?: number;
      episode_type?: 'canon' | 'filler' | 'mixed' | 'recap';
    };

    type TeamData = {
      id?: string;
      title: string;
      logo: string;
      canonicalTitle?: string;
      translationType?: 'dub' | 'sub' | 'unknown';
    };

    interface EditorContent {
      suggestion: {
        name_ua: string;
        name_en?: string;
        name_ja?: string;
        name_native?: string;
      };
    }
  }
}
