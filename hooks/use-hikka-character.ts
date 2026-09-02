import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import { queryClient } from '@/entrypoints/content';

import { usePageStore } from './use-page-store';

const hikkaCharacterFetcher = async (slug: string) => {
  return ky.get(`https://api.hikka.io/characters/${slug}`).json<any>();
};

const useHikkaCharacter = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['hikka-character-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaCharacterFetcher(queryKey[1]),
    retry: false,
    staleTime: Infinity,
    enabled,
  });
};

export const prefetchHikkaCharacter = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-character-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaCharacterFetcher(queryKey[1]),
  });
};

export default useHikkaCharacter;
