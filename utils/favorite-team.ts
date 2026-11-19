import type { FavoriteTeam } from '@/hooks/use-settings';

import { looseKey } from './utils';

/**
 * The team a favourite names: by its key, else by catalogue id or name, as
 * keys change once a team joins the catalogue. Prefers the favourite's
 * translation when a name matches several.
 */
export const findFavorite = <T extends Omit<API.TeamData, 'logo'>>(
  teams: T[],
  favorite?: FavoriteTeam,
) => {
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

/** How settings remember `team` as a favourite. */
export const favoriteTeamOf = (
  team: Omit<API.TeamData, 'logo'>,
): FavoriteTeam => ({
  key: team.key,
  team: team.title,
  teamId: team.id,
  translationType: team.translationType,
});
