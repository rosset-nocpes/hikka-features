import type {
  ConvexEpisodeInfo,
  ConvexWatchResponse,
  TranslationType,
} from './convex-api';

declare global {
  namespace API {
    type WatchData = {
      type: 'tv' | 'movie' | 'ona';
      /** In the order the backend lists them. */
      providers: ConvexWatchResponse['providers'];
      /** Each team once, in one translation, by name. */
      teams: WatchTeam[];
    };

    /** An episode as one provider plays it. */
    type EpisodeData = {
      episode: number;
      video_url: string;
      provider: string;
      title?: ConvexEpisodeInfo['title'];
      releasedAt?: number;
      episode_type?: ConvexEpisodeInfo['type'];
    };

    type TeamData = {
      /** Names the team whichever provider lists it (see the backend). */
      key: string;
      id?: string;
      /** The team's page, `/teams/<slug>`. */
      slug?: string;
      title: string;
      logo: string;
      /** Uploads crediting no team, named after their provider. */
      unnamed?: boolean;
      translationType: TranslationType;
    };

    /** A team with every provider's copy of its episodes, by number. */
    type WatchTeam = TeamData & { sources: EpisodeData[] };

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
