import type { ConvexEpisodeInfo, TranslationType } from './convex-api';
import type { ProviderIFrame, ProviderTeamIFrame } from './providers';

declare global {
  namespace API {
    type WatchData = {
      type: 'tv' | 'movie' | 'ona';
      [key: string]: ProviderTeamIFrame | ProviderIFrame;
    };

    type EpisodeData = {
      episode: number;
      video_url: string;
      title?: ConvexEpisodeInfo['title'];
      releasedAt?: number;
      episode_type?: ConvexEpisodeInfo['type'];
    };

    type TeamData = {
      id?: string;
      /** The team's page, `/teams/<slug>`. */
      slug?: string;
      title: string;
      logo: string;
      canonicalTitle?: string;
      translationType?: TranslationType;
    };

    interface EditorContent {
      suggestion: {
        name_ua?: string;
        name_en?: string;
        name_ja?: string;
        name_native?: string;
      };
    }
  }
}
