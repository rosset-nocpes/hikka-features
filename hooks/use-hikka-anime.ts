import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/entrypoints/content';
import { usePageStore } from './use-page-store';

const hikkaAnimeFetcher = async (slug: string) => {
  const r = await fetch(`https://api.hikka.io/anime/${slug}`);

  if (!r.ok) {
    throw new Error('Not found');
  }

  return r.json();
};

const useHikkaAnime = () => {
  return useQuery({
    queryKey: ['hikka-anime-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaAnimeFetcher(queryKey[1]),
    retry: false,
    staleTime: Infinity,
  });
};

export const prefetchHikkaAnime = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-anime-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaAnimeFetcher(queryKey[1]),
  });
};

export default useHikkaAnime;
