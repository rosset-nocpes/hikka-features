import type { PreferredTranslation } from '@/utils/convex-api';

import { ProviderTeamIFrame } from '@/utils/provider_classes';

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
export const groupTeams = (teams: API.TeamData[], favorite?: string) => {
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
