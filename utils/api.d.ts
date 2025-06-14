export {};

declare global {
  namespace API {
    /* Anime */
    type WatchData = {
      type: 'tv' | 'movie' | 'ona';
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
    type ReadData = {
      chapters: ChapterData[];
    };

    type ChapterData = {
      id: string;
      volume: number;
      chapter: number;
      title: string;
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
