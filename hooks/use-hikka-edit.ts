import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/entrypoints/content';
import { usePageStore } from './use-page-store';

export const hikkaEditFetcher = async (id: number) => {
  const r = await fetch(`https://api.hikka.io/edit/${id}`);

  if (!r.ok) {
    throw new Error('Not found');
  }

  return r.json();
};

const useHikkaEdit = () => {
  return useQuery({
    queryKey: ['hikka-edit-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaEditFetcher(Number(queryKey[1])),
    retry: false,
    staleTime: Infinity,
  });
};

export const prefetchHikkaEdit = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-edit-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaEditFetcher(Number(queryKey[1])),
  });
};

export default useHikkaEdit;
