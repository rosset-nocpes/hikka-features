import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/entrypoints/content';
import { usePageStore } from './use-page-store';

const hikkaMangaFetcher = async (slug: string) => {
  const r = await fetch(`https://api.hikka.io/manga/${slug}`);

  if (!r.ok) {
    throw new Error('Not found');
  }

  return r.json();
};

const useHikkaManga = () => {
  return useQuery({
    queryKey: ['hikka-manga-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaMangaFetcher(queryKey[1]),
    retry: false,
    staleTime: Infinity,
  });
};

export const prefetchHikkaManga = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-manga-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaMangaFetcher(queryKey[1]),
  });
};

export default useHikkaManga;
