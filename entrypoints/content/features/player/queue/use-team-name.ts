import { useQuery } from '@tanstack/react-query';

import { watchDataQuery } from '@/hooks/use-watch-data';

/** The name of `slug`'s team `key`, from that anime's watch data. */
export const useTeamName = (slug?: string, key?: string) => {
  const { data } = useQuery({
    ...watchDataQuery(slug),
    enabled: !!slug && !!key,
  });
  return key ? data?.teams.find((team) => team.key === key)?.title : undefined;
};
