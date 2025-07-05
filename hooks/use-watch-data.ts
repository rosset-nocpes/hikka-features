import { useQuery } from '@tanstack/react-query';
import useHikkaAnime from './use-hikka-anime';

// TODO: add types for api
const useWatchData = () => {
  const { data: anime_data } = useHikkaAnime();

  return useQuery({
    queryKey: ['watch-data', anime_data.slug],
    queryFn: async () => {
      const r = await fetch(
        `${BACKEND_BRANCHES[await backendBranch.getValue()]}/watch/${
          anime_data.slug
        }`,
      );

      if (!r.ok) {
        throw new Error('Not found');
      }

      return (await r.json()) as API.WatchData;
    },
    retry: false,
    staleTime: Infinity,
  });
};

export default useWatchData;
