import { useQuery } from '@tanstack/react-query';

import { convexApi } from '@/utils/convex-api';
import { publicQuery } from '@/utils/convex-client';

const useNotionData = () => {
  const { slug } = usePageStore();

  return useQuery({
    queryKey: ['notion-data', slug],
    queryFn: async (): Promise<API.NotionData> => {
      const data = await publicQuery(convexApi.catalog.get, { slug: slug! });
      if (!data) throw new Error('Not found');
      return {
        poster: data.poster,
        fandub: data.fandub.map((team) => ({ ...team, logo: team.logo ?? '' })),
      };
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    enabled: !!slug,
  });
};

export default useNotionData;
