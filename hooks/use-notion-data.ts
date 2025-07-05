import { useQuery } from '@tanstack/react-query';
import useHikkaAnime from './use-hikka-anime';

const useNotionData = () => {
  const { data } = useHikkaAnime();

  return useQuery({
    queryKey: ['notion-data', data.slug],
    queryFn: async () => {
      const r = await fetch(
        `${BACKEND_BRANCHES[await backendBranch.getValue()]}/notion/${data.slug}`,
      );

      if (!r.ok) {
        throw new Error('Not found');
      }

      return (await r.json()) as API.NotionData;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useNotionData;
