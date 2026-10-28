import type { PreferredTranslation } from '@/utils/convex-api';

import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/provider_classes';

/** The providers in the watch data, with the language each plays in. */
export const providersOf = (data: API.WatchData) =>
  Object.entries(data).flatMap(([title, entry]) =>
    typeof entry === 'string' ? [] : [{ title, lang: entry.lang }],
  );

/** Providers by language, in the order the menus list languages. */
export const groupProviders = (data: API.WatchData) => {
  const providers = providersOf(data);
  return ALL_LANGUAGES.flatMap((lang) => {
    const titles = providers
      .filter((provider) => provider.lang === lang)
      .map((provider) => provider.title);
    return titles.length ? [{ lang, titles }] : [];
  });
};

/**
 * Name to show for a team. `title` is the team's key, which gets a dub/sub
 * suffix when one team has both, so it is not meant for display.
 */
export const getTeamName = (
  team: Pick<API.TeamData, 'title' | 'canonicalTitle'>,
) => team.canonicalTitle || team.title;

const groups = [
  { type: 'dub', label: 'Озвучення' },
  { type: 'sub', label: 'Субтитри' },
  { type: 'unknown', label: 'Інші' },
] as const;

/** Splits teams into dub, sub and other sections, the favourite first. */
export const groupTeams = <
  T extends Pick<API.TeamData, 'title' | 'translationType'>,
>(
  teams: T[],
  favorite?: string,
) => {
  const ordered = teams.toSorted(
    (a, b) => Number(b.title === favorite) - Number(a.title === favorite),
  );

  return groups
    .map((group) => ({
      ...group,
      teams: ordered.filter(
        (team) => (team.translationType ?? 'unknown') === group.type,
      ),
    }))
    .filter((group) => group.teams.length > 0);
};

/** "1-12, 14" for the episode numbers a team has. */
export const getEpisodeRanges = (episodes: { episode: number }[]) => {
  const numbers = [...new Set(episodes.map((e) => e.episode))].sort(
    (a, b) => a - b,
  );
  const ranges: [start: number, end: number][] = [];
  for (const number of numbers) {
    const last = ranges.at(-1);
    if (last && number === last[1] + 1) last[1] = number;
    else ranges.push([number, number]);
  }
  return ranges
    .map(([start, end]) => (start === end ? `${start}` : `${start}-${end}`))
    .join(', ');
};

/**
 * Names a team whichever provider lists it: by its catalogue id, else its
 * name, and its translation. A provider without teams stands for its own.
 */
export const teamKey = (provider: string, team: API.TeamData) =>
  team.title
    ? `${team.id ?? getTeamName(team)}:${team.translationType ?? 'unknown'}`
    : provider;

/** A team's episode, with the source that plays it. */
export interface TeamEpisode {
  provider: string;
  /** The team's key in that provider's watch data; empty without teams. */
  team: string;
  data: API.EpisodeData;
}

export type MergedTeam = API.TeamData & {
  key: string;
  episodes: TeamEpisode[];
};

/**
 * Every team of the watch data once, however many providers list it, each
 * episode from the first of `providers` that has it. Providers without teams
 * are teams named after themselves.
 */
export const mergeTeams = (
  data: API.WatchData,
  providers: string[],
): MergedTeam[] => {
  const teams = new Map<
    string,
    { team: API.TeamData; episodes: Map<number, TeamEpisode> }
  >();

  for (const provider of new Set(providers)) {
    const source = data[provider];
    const entries =
      source instanceof ProviderTeamIFrame
        ? source.getTeams().map((team) => ({
            team,
            episodes: source.teams[team.title]!.episodes,
          }))
        : source instanceof ProviderIFrame
          ? [
              {
                team: {
                  title: '',
                  logo: '',
                  canonicalTitle: provider.toUpperCase(),
                },
                episodes: source.episodes,
              },
            ]
          : [];

    for (const { team, episodes } of entries) {
      const key = teamKey(provider, team);
      const merged = teams.get(key) ?? { team, episodes: new Map() };
      for (const episode of episodes) {
        if (merged.episodes.has(episode.episode)) continue;
        merged.episodes.set(episode.episode, {
          provider,
          team: team.title,
          data: episode,
        });
      }
      teams.set(key, merged);
    }
  }

  return [...teams].map(([key, { team, episodes }]) => ({
    ...team,
    key,
    episodes: [...episodes.values()].sort(
      (a, b) => a.data.episode - b.data.episode,
    ),
  }));
};

/**
 * The team-priority pick: the most preferred team that has `episode` in the
 * chosen translation, then in another one, since opening the next episode
 * matters more. Without it anywhere, the chosen translation comes first.
 * Ties go to providers in the given order.
 */
export const pickPriorityTeam = (
  data: API.WatchData,
  providers: string[],
  priority: { id: string }[],
  translation: PreferredTranslation,
  episode: number,
) => {
  const candidates = priority.flatMap(({ id }) =>
    providers.flatMap((provider) => {
      const source = data[provider];
      if (!(source instanceof ProviderTeamIFrame)) return [];
      return source
        .getTeams()
        .filter((team) => team.id === id)
        .map((team) => ({
          pick: { provider, team },
          chosen: team.translationType === translation,
          hasEpisode: (source.teams[team.title]?.episodes ?? []).some(
            (entry) => entry.episode === episode,
          ),
        }));
    }),
  );

  return (
    candidates.find(({ chosen, hasEpisode }) => chosen && hasEpisode) ??
    candidates.find(({ hasEpisode }) => hasEpisode) ??
    candidates.find(({ chosen }) => chosen) ??
    candidates[0]
  )?.pick;
};
