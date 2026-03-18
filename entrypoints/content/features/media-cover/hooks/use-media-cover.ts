import { useQuery } from '@tanstack/react-query';
import { usePageStore } from '@/hooks/use-page-store';

export type MediaType = 'anime' | 'manga' | 'novel';

interface HikkaData {
  mal_id: number;
  slug: string;
}

const hikkaFetcher = async (
  contentType: string,
  slug: string,
): Promise<HikkaData> => {
  const r = await fetch(
    `https://api.hikka.io/${
      contentType === 'character'
        ? 'characters'
        : contentType === 'person'
          ? 'people'
          : contentType
    }/${slug}`,
  );

  if (!r.ok) {
    throw new Error('Not found');
  }

  return r.json();
};

const useMediaCover = () => {
  const storeSlug = usePageStore((s) => s.slug);
  const storeContentType = usePageStore((s) => s.contentType);

  const { data: hikkaData } = useQuery({
    queryKey: ['hikka-data', storeContentType, storeSlug],
    queryFn: () => hikkaFetcher(storeContentType!, storeSlug!),
    retry: false,
    staleTime: Infinity,
    enabled: !!storeContentType && !!storeSlug,
  });

  const effectiveType =
    storeContentType === 'characters'
      ? 'anime'
      : storeContentType === 'person'
        ? 'anime'
        : (storeContentType as MediaType);

  return useQuery({
    queryKey: ['media-cover', hikkaData?.mal_id, effectiveType],
    queryFn: async () => {
      const anilist_url = 'https://graphql.anilist.co';
      const banner_query = `
        query media($mal_id: Int, $type: MediaType) {
            Media(idMal: $mal_id, type: $type) {
              bannerImage
            }
        }
        `;

      const r = await fetch(anilist_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: banner_query,
          variables: {
            mal_id: hikkaData?.mal_id,
            type: effectiveType?.toUpperCase(),
          },
        }),
      });

      if (!r.ok) {
        throw new Error('Not found');
      }

      return (await r.json()).data.Media.bannerImage as string | null;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    enabled: !!hikkaData?.mal_id && !!effectiveType,
  });
};

export const hikkaMediaFetcher = hikkaFetcher;
export default useMediaCover;
