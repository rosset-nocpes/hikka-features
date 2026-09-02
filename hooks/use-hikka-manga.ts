import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import { queryClient } from '@/entrypoints/content';

import { usePageStore } from './use-page-store';

const hikkaMangaFetcher = async (slug: string) => {
  return ky.get(`https://api.hikka.io/manga/${slug}`).json<any>();
};

const useHikkaManga = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['hikka-manga-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaMangaFetcher(queryKey[1]),
    retry: false,
    staleTime: Infinity,
    enabled,
  });
};

export const prefetchHikkaManga = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-manga-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaMangaFetcher(queryKey[1]),
  });
};

export default useHikkaManga;
