import { ProviderTeamIFrame } from '@/utils/provider_classes';

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
 * The team-priority pick: the most preferred team that already has `episode`,
 * or failing that the most preferred team at all. A team's dub comes before
 * its other versions, then providers in the given order.
 */
export const pickPriorityTeam = (
  data: API.WatchData,
  providers: string[],
  priority: { id: string }[],
  episode: number,
) => {
  let fallback: { provider: string; team: API.TeamData } | undefined;
  for (const { id } of priority) {
    const candidates = providers
      .flatMap((provider) => {
        const source = data[provider];
        if (!(source instanceof ProviderTeamIFrame)) return [];
        return source
          .getTeams()
          .filter((team) => team.id === id)
          .map((team) => ({
            pick: { provider, team },
            episodes: source.teams[team.title]?.episodes ?? [],
          }));
      })
      .sort(
        (a, b) =>
          Number(b.pick.team.translationType === 'dub') -
          Number(a.pick.team.translationType === 'dub'),
      );

    for (const { pick, episodes } of candidates) {
      if (episodes.some((entry) => entry.episode === episode)) return pick;
      fallback ??= pick;
    }
  }
  return fallback;
};
