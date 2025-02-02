import { useQuery } from '@tanstack/react-query';

// TODO: add types for api
const useWatchData = (anime_data: any) => {
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
    staleTime: 0,
    gcTime: 0,
  });
};

export default useWatchData;
