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
}
