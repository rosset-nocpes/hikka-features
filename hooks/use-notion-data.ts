import { useQuery } from '@tanstack/react-query';

import { convexApi } from '@/utils/convex-api';
import { convexAction } from '@/utils/convex-client';

const useNotionData = () => {
  const { slug } = usePageStore();

  return useQuery({
    queryKey: ['notion-data', slug],
    queryFn: async () => {
      const data = await convexAction(convexApi.catalog.get, {
        slug: slug!,
      });
      if (!data) throw new Error('Not found');
      return {
        ...data,
        fandub: data.fandub.map((team) => ({
          ...team,
          logo: team.logo ?? '',
        })),
      } as API.NotionData;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    enabled: !!slug,
  });
};

export default useNotionData;
