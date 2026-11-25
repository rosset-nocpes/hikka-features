import type { PreferredTranslation } from '@/utils/convex-api';

const groups = [
  { type: 'dub', label: 'Озвучення' },
  { type: 'sub', label: 'Субтитри' },
  { type: 'unknown', label: 'Інші' },
] as const;

/** Splits teams into dub, sub and other sections, the favourite first. */
export const groupTeams = <
  T extends Pick<MergedTeam, 'key' | 'translationType'>,
>(
  teams: T[],
  favorite?: string,
) => {
  const ordered = teams.toSorted(
    (a, b) => Number(b.key === favorite) - Number(a.key === favorite),
  );

  return groups
    .map((group) => ({
      ...group,
      teams: ordered.filter((team) => team.translationType === group.type),
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

/** A team as the player shows it: one provider's copy of each episode. */
export type MergedTeam = API.WatchTeam & { episodes: API.EpisodeData[] };

/**
 * Of each episode, the copies of the first provider in `order` that has it;
 * a provider's own duplicates stay. `sources` is sorted by number.
 */
export const pickEpisodes = (sources: API.EpisodeData[], order: string[]) => {
  const rank = (episode: API.EpisodeData) => {
    const index = order.indexOf(episode.provider);
    return index < 0 ? order.length : index;
  };
  const best = new Map<number, number>();
  for (const source of sources) {
    best.set(
      source.episode,
      Math.min(best.get(source.episode) ?? Infinity, rank(source)),
    );
  }
  return sources.filter((source) => rank(source) === best.get(source.episode));
};

/** Whether `team` has `episode`, from any of its providers. */
export const hasEpisode = (team: MergedTeam, episode: number) =>
  team.episodes.some((entry) => entry.episode === episode);

/**
 * The team-priority pick: the most preferred team that has `episode` in the
 * chosen translation, then in another one, since opening the next episode
 * matters more. Without it anywhere, the chosen translation comes first.
 */
export const pickPriorityTeam = (
  teams: MergedTeam[],
  priority: { id: string }[],
  translation: PreferredTranslation,
  episode: number,
) => {
  const candidates = priority.flatMap(({ id }) =>
    teams
      .filter((team) => team.id === id)
      .map((team) => ({
        team,
        chosen: team.translationType === translation,
        has: hasEpisode(team, episode),
      })),
  );

  return (
    candidates.find(({ chosen, has }) => chosen && has) ??
    candidates.find(({ has }) => has) ??
    candidates.find(({ chosen }) => chosen) ??
    candidates[0]
  )?.team;
};
