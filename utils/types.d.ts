export {};

declare global {
  type MediaType = "anime" | "manga" | "novel";

  type InfoType = "character" | "person";

  type SourcesType =
    | "mal"
    | "anilist"
    | "anidb"
    | "ann"
    | "wiki"
    | "amanogawa"
    | "mu";
  // | "dengeki"

  type PlayerSource = "moon" | "ashdi";

  type PlayerData = PlayerSource | "type";

  type BackendBranches = "stable" | "beta";

  type UserData = {
    username: string;
    avatar: string;
  };

  type HikkaSecret = {
    secret: string;
    expiration: number;
  };

  type ChapterDataEntry = {
    id: string;
    volume: number;
    chapter: number;
    title: string;
    pages: number;
  };
}
