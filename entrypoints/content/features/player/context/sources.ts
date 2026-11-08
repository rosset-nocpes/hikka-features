import type { FavoriteTeam } from '@/hooks/use-settings';

import { hikkaTracker } from '@/utils/hikka-tracker';

import type { QueueItem } from '../queue/use-queue';
import type { SharedPlayerParams } from './link-params';

import {
  hasEpisode,
  type MergedTeam,
  pickEpisodes,
  pickPriorityTeam,
} from '../teams';

/** Whether the page is `slug`'s, whose tracker the player may read and use. */
export const onAnimePage = (slug?: string) => {
  const page = usePageStore.getState();
  return !!slug && page.contentType === 'anime' && page.slug === slug;
};

/** Episodes of `slug` the user watched, known on its own page only. */
export const progressOf = (slug?: string) =>
  onAnimePage(slug) ? hikkaTracker.progress : 0;

/** The episode after the user's progress on hikka.io, else the first. */
export const nextUnwatched = (episodes: API.EpisodeData[], slug?: string) =>
  episodes.find(({ episode }) => episode === progressOf(slug) + 1) ??
  episodes[0]!;

/**
 * The order providers play episodes in: the one the user picked, then the
 * default one from the settings, then the rest.
 */
export const providerOrder = (data: API.WatchData, pinned?: string) => {
  const { defaultProvider } = useSettings.getState().features.player;
  const available = data.providers.map(({ id }) => id);
  return [
    ...new Set([
      ...[pinned, defaultProvider].filter(
        (name): name is string => !!name && available.includes(name),
      ),
      ...available,
    ]),
  ];
};

/** The watch data's teams, each episode from the first provider in order. */
export const teamsOf = (data: API.WatchData, pinned?: string): MergedTeam[] => {
  const order = providerOrder(data, pinned);
  return data.teams.map((team) => ({
    ...team,
    episodes: pickEpisodes(team.sources, order),
  }));
};

/**
 * The team a favourite names: by its key, else by catalogue id or name, as
 * keys change once a team joins the catalogue.
 */
export const findFavorite = (teams: MergedTeam[], favorite?: FavoriteTeam) => {
  if (!favorite) return undefined;
  const exact = teams.find((team) => team.key === favorite.key);
  if (exact) return exact;
  const candidates = teams.filter((team) =>
    favorite.teamId
      ? team.id === favorite.teamId
      : looseKey(team.title) === looseKey(favorite.team),
  );
  return (
    candidates.find(
      (team) => team.translationType === (favorite.translationType ?? 'dub'),
    ) ?? candidates[0]
  );
};

/** `slug`'s favourite team, if any provider still lists it. */
export const favoriteOf = (teams: MergedTeam[], slug: string) =>
  findFavorite(
    teams,
    useSettings.getState().features.player.favoriteTeams[slug],
  );

/** The user's team priority's pick for `episode`. */
const priorityPick = (teams: MergedTeam[], episode: number) => {
  const { teamPriority, teamPriorityTranslation } =
    useSettings.getState().features.player;
  return pickPriorityTeam(
    teams,
    teamPriority,
    teamPriorityTranslation,
    episode,
  );
};

/**
 * The team the player opens `slug` with: its favourite, then the team
 * priority's pick, then the first team with the next episode.
 */
export const preferredTeam = (teams: MergedTeam[], slug: string) => {
  const next = progressOf(slug) + 1;
  return (
    favoriteOf(teams, slug) ??
    priorityPick(teams, next) ??
    teams.find((team) => hasEpisode(team, next)) ??
    teams[0]!
  );
};

/** What the player shows: a team, and its episode that plays. */
export interface Selection {
  team: MergedTeam;
  entry: API.EpisodeData;
}

/** `team`'s episode `number`, from whichever provider the list takes it. */
const episodeIn = (team: MergedTeam, number: number) =>
  team.episodes.find(({ episode }) => episode === number);

/**
 * The team `key` playing `provider`'s copy of `episode`, even where its list
 * takes that episode from another provider.
 */
export const exactSource = (
  teams: MergedTeam[],
  provider: string,
  key: string,
  episode: number,
): Selection | undefined => {
  const team = teams.find((candidate) => candidate.key === key);
  const entry = team?.sources.find(
    (source) => source.provider === provider && source.episode === episode,
  );
  if (!team || !entry) return undefined;
  if (team.episodes.includes(entry)) return { team, entry };

  // This provider's copy takes the place of the others'.
  const rest = team.episodes.filter((other) => other.episode !== episode);
  const index = rest.findIndex((other) => other.episode > episode);
  return {
    team: {
      ...team,
      episodes: index < 0 ? [...rest, entry] : rest.toSpliced(index, 0, entry),
    },
    entry,
  };
};

/**
 * Where a share link plays: its provider's copy, else its team's from
 * another provider, else the preferred team, at the link's episode where
 * they have it.
 */
export const sharedSource = (
  teams: MergedTeam[],
  slug: string,
  { provider, team, episode }: SharedPlayerParams,
): Selection => {
  const number = Number(episode);
  const exact = exactSource(teams, provider!, team!, number);
  if (exact) return exact;

  const shown =
    teams.find((candidate) => candidate.key === team) ??
    preferredTeam(teams, slug);
  return {
    team: shown,
    entry: episodeIn(shown, number) ?? nextUnwatched(shown.episodes, slug),
  };
};

/**
 * Where a queued episode plays: the provider it was queued from, else its
 * team's from another one, else the team priority's pick, else any team
 * that has it.
 */
export const queuedSource = (
  teams: MergedTeam[],
  target: QueueItem,
): Selection | undefined => {
  const exact = exactSource(
    teams,
    target.provider,
    target.team,
    target.episode,
  );
  if (exact) return exact;

  const candidates = [
    teams.find((team) => team.key === target.team),
    priorityPick(teams, target.episode),
    ...teams,
  ];
  for (const team of candidates) {
    const entry = team && episodeIn(team, target.episode);
    if (entry) return { team: team!, entry };
  }
  return undefined;
};

/** Changes only when the watch data's teams or episodes do. */
export const watchDataKey = (data: API.WatchData) =>
  JSON.stringify([
    data.type,
    data.providers.map(({ id }) => id),
    data.teams.map((team) => [
      team.key,
      team.title,
      team.logo,
      team.sources.map((source) => [
        source.episode,
        source.provider,
        source.video_url,
      ]),
    ]),
  ]);
