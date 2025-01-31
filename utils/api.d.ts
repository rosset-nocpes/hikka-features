export {};

declare global {
  namespace API {
    /* Anime */
    type WatchData = {
      type: 'tv' | 'movie';
      [key: string]: ProviderData;
    };

    type NotionData = {
      poster?: string;
      fandub?: FandubTeam[];
    };

    type FandubTeam = {
      title: string;
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
    type ChapterData = {
      id: string;
      volume: number;
      chapter: number;
      title: string;
      pages: number;
      scanlation_groups: ScanlationGroup[];
      users: ChapterUser[];
    };

    type ChapterResponse = {
      translators: Record<string, Omit<ScanlationGroup, 'name'>>;
      chapters: ChapterData[];
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
  }
}
