import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/entrypoints/content';
import { usePageStore } from './use-page-store';

const hikkaNovelFetcher = async (slug: string) => {
  const r = await fetch(`https://api.hikka.io/novel/${slug}`);

  if (!r.ok) {
    throw new Error('Not found');
  }

  return r.json();
};

const useHikkaNovel = () => {
  return useQuery({
    queryKey: ['hikka-novel-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaNovelFetcher(queryKey[1]),
    retry: false,
    staleTime: Infinity,
  });
};

export const prefetchHikkaNovel = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-novel-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaNovelFetcher(queryKey[1]),
  });
};

export default useHikkaNovel;
