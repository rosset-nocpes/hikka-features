import { useQuery } from '@tanstack/react-query';

import { usePageStore } from '@/hooks/use-page-store';

export type MediaType = 'anime' | 'manga' | 'novel';

interface CharacterMediaListItem {
  anime?: { mal_id: number };
  manga?: { mal_id: number };
}

interface CharacterMediaResponse {
  list: CharacterMediaListItem[];
}

const API_BASE_URL = 'https://api.hikka.io';
const ANILIST_URL = 'https://graphql.anilist.co';

const fetchCharacterMedia = async (
  slug: string,
  mediaType: 'anime' | 'manga',
): Promise<number | null> => {
  const response = await fetch(
    `${API_BASE_URL}/characters/${slug}/${mediaType}`,
  );
  if (!response.ok) return null;

  const data: CharacterMediaResponse = await response.json();
  return data.list[0]?.[mediaType]?.mal_id ?? null;
};

const fetchBannerImage = async (
  malId: number | null,
  mediaType: MediaType | undefined,
): Promise<string | null> => {
  if (!malId || !mediaType) return null;

  if (mediaType === 'novel') mediaType = 'manga';

  const query = `
    query media($mal_id: Int, $type: MediaType) {
      Media(idMal: $mal_id, type: $type) {
        bannerImage
      }
    }
  `;

  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        mal_id: malId,
        type: mediaType.toUpperCase(),
      },
    }),
  });

  if (!response.ok) return null;

  const json = await response.json();
  return json.data?.Media?.bannerImage ?? null;
};

const getCharacterMalId = async (
  slug: string,
  animeCount: number,
  mangaCount: number,
  savedMalId: number | null,
): Promise<number | null> => {
  if (savedMalId) return savedMalId;

  if (animeCount > 0) {
    const malId = await fetchCharacterMedia(slug, 'anime');
    if (malId) return malId;
  }

  if (mangaCount > 0) {
    return fetchCharacterMedia(slug, 'manga');
  }

  return null;
};

const useMediaCover = () => {
  const { contentType: storeContentType, saved_mal_id, slug } = usePageStore();
  const { data: hikkaData, isLoading } = useHikka();

  let malId = hikkaData?.mal_id ?? saved_mal_id ?? null;

  return useQuery({
    queryKey: ['media-cover', malId],
    queryFn: async () => {
      if (!slug) return null;

      let effectiveType: MediaType | undefined =
        storeContentType === 'characters' || storeContentType === 'person'
          ? 'anime'
          : storeContentType === 'edit'
            ? undefined
            : (storeContentType as MediaType);

      if (hikkaData?.data_type === 'character' && !hikkaData?.mal_id) {
        malId = await getCharacterMalId(
          slug,
          hikkaData.anime_count ?? 0,
          hikkaData.manga_count ?? 0,
          saved_mal_id ?? null,
        );
      }

      if (storeContentType === 'edit' && !hikkaData?.mal_id) {
        const contentData = await hikkaEditContentFetcher();

        if (contentData?.data_type === 'character') {
          malId = await getCharacterMalId(
            contentData.slug,
            contentData.anime_count ?? 0,
            contentData.manga_count ?? 0,
            saved_mal_id ?? null,
          );

          if (malId) {
            effectiveType = contentData.anime_count > 0 ? 'anime' : 'manga';
          }
        }
      }

      return fetchBannerImage(malId, effectiveType);
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    enabled: !!slug && !isLoading,
  });
};

export default useMediaCover;
