import { useHikkaContent } from '@/hooks/use-hikka';

import { usePlayer } from './context/player-context';
import { getTeamName } from './teams';

/**
 * What the player shows, for its compact headings: the anime's title, and
 * "Епізод 5 · Team" under it.
 */
export const useNowPlaying = () => {
  const { slug, team, currentEpisode } = usePlayer();
  // The player's anime, which the page may no longer show.
  const { data: anime } = useHikkaContent('anime', slug);

  const teamName = team && getTeamName(team);
  return {
    slug,
    team,
    teamName,
    title: hikkaTitle(anime),
    subtitle: currentEpisode?.episode
      ? `Епізод ${currentEpisode.episode}${teamName ? ` · ${teamName}` : ''}`
      : teamName,
  };
};
