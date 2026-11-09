import { useQuery } from '@tanstack/react-query';

import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';

/** The page's anime's Ukrainian poster, from the extension's catalog. */
const useLocalizedPoster = () => {
  const { slug } = usePageStore();

  return useQuery({
    queryKey: ['localized-poster', slug],
    queryFn: async () => {
      const data = await convex.query(convexApi.catalog.get, { slug: slug! });
      if (!data) throw new Error('Not found');
      return data.poster;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    enabled: !!slug,
  });
};

export default useLocalizedPoster;
