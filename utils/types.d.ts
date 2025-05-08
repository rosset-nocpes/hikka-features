export { };

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

  type PlayerSource = "moon" | "ashdi" | "vidsrc";

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
}
