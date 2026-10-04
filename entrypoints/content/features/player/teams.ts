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
