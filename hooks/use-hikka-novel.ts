import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import { queryClient } from '@/entrypoints/content';

import { usePageStore } from './use-page-store';

const hikkaNovelFetcher = async (slug: string) => {
  return ky.get(`https://api.hikka.io/novel/${slug}`).json<any>();
};

const useHikkaNovel = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['hikka-novel-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaNovelFetcher(queryKey[1]),
    retry: false,
    staleTime: Infinity,
    enabled,
  });
};

export const prefetchHikkaNovel = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-novel-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaNovelFetcher(queryKey[1]),
  });
};

export default useHikkaNovel;
