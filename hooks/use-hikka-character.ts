import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/entrypoints/content';
import { usePageStore } from './use-page-store';

const hikkaCharacterFetcher = async (
  slug: string,
  sourceType: 'anime' | 'manga' = 'anime',
) => {
  const r = await fetch(
    `https://api.hikka.io/characters/${slug}/${sourceType}`,
  );

  if (!r.ok) {
    throw new Error('Not found');
  }

  return r.json();
};

const useHikkaCharacter = ({
  enabled,
  sourceType = 'anime',
}: {
  enabled: boolean;
  sourceType?: 'anime' | 'manga';
}) => {
  return useQuery({
    queryKey: [
      'hikka-character-data',
      usePageStore.getState().slug!,
      sourceType,
    ],
    queryFn: ({ queryKey }) =>
      hikkaCharacterFetcher(queryKey[1], queryKey[2] as 'anime' | 'manga'),
    retry: false,
    staleTime: Infinity,
    enabled,
  });
};

export const prefetchHikkaCharacter = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-character-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) =>
      hikkaCharacterFetcher(queryKey[1], queryKey[2] as 'anime' | 'manga'),
  });
};

export default useHikkaCharacter;
