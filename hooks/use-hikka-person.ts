import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import { queryClient } from '@/entrypoints/content';

import { usePageStore } from './use-page-store';

const hikkaPersonFetcher = async (slug: string) => {
  return ky.get(`https://api.hikka.io/people/${slug}`).json<any>();
};

const useHikkaPerson = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['hikka-person-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaPersonFetcher(queryKey[1]),
    retry: false,
    staleTime: Infinity,
    enabled,
  });
};

export const prefetchHikkaPerson = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-person-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaPersonFetcher(queryKey[1]),
  });
};

export default useHikkaPerson;
