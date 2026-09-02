import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import { queryClient } from '@/entrypoints/content';

import { usePageStore } from './use-page-store';

export const hikkaAnimeFetcher = async (slug: string) => {
  return ky.get(`https://api.hikka.io/anime/${slug}`).json<any>();
};

const useHikkaAnime = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['hikka-anime-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaAnimeFetcher(queryKey[1]),
    retry: false,
    staleTime: Infinity,
    enabled,
  });
};

export const prefetchHikkaAnime = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-anime-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaAnimeFetcher(queryKey[1]),
  });
};

export default useHikkaAnime;
