import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import { BACKEND_BRANCHES } from '@/utils/constants';
import { convexApi } from '@/utils/convex-api';
import { CONVEX_URL, convexAction } from '@/utils/convex-client';

const useNotionData = () => {
  const { backendBranch } = useSettings();
  const { slug } = usePageStore();

  return useQuery({
    queryKey: ['notion-data', slug],
    queryFn: async () => {
      if (CONVEX_URL) {
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
      }

      return ky
        .get(`${BACKEND_BRANCHES[backendBranch]}/notion/${slug}`)
        .json<API.NotionData>();
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    enabled: !!slug,
  });
};

export default useNotionData;
