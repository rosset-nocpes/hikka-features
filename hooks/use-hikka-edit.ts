import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/entrypoints/content';

import { usePageStore } from './use-page-store';

const hikkaEditFetcher = async (edit_id: string) => {
  const r = await fetch(`https://api.hikka.io/edit/${edit_id}`);

  if (!r.ok) {
    throw new Error('Not found');
  }

  return r.json();
};

const useHikkaEdit = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['hikka-edit-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaEditFetcher(queryKey[1]),
    retry: false,
    staleTime: Infinity,
    enabled,
  });
};

export const prefetchHikkaEdit = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-edit-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaEditFetcher(queryKey[1]),
  });
};

export default useHikkaEdit;
