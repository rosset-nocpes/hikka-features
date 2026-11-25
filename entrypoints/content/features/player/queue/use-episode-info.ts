import { useQuery } from '@tanstack/react-query';

import { watchDataQuery } from '@/hooks/use-watch-data';

import { getEpisodeTitle } from '../sidebar/episode-list';

/**
 * The name of `slug`'s team `key` and the title of its `episode`, from that
 * anime's watch data.
 */
export const useEpisodeInfo = (
  slug?: string,
  key?: string,
  episode?: number,
) => {
  const { data } = useQuery({
    ...watchDataQuery(slug),
    enabled: !!slug && !!key,
  });
  const team = key ? data?.teams.find((one) => one.key === key) : undefined;
  const source = team?.sources.find((one) => one.episode === episode);
  return {
    teamName: team?.title,
    title: source && getEpisodeTitle(source),
  };
};
