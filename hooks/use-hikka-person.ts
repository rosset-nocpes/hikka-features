import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/entrypoints/content';
import { usePageStore } from './use-page-store';

const hikkaPersonFetcher = async (slug: string) => {
  const r = await fetch(`https://api.hikka.io/people/${slug}`);

  if (!r.ok) {
    throw new Error('Not found');
  }

  return r.json();
};

const useHikkaPerson = ({ enabled }: { enabled: boolean }) => {
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
