import { useQuery } from '@tanstack/react-query';

import { usePageStore } from '@/hooks/use-page-store';

export type MediaType = 'anime' | 'manga' | 'novel';

const useMediaCover = () => {
  const { contentType: storeContentType, saved_mal_id, slug } = usePageStore();

  const { data: hikkaData, isLoading } = useHikka();

  return useQuery({
    queryKey: ['media-cover', hikkaData?.slug],
    queryFn: async () => {
      let mal_id = hikkaData?.mal_id;
      let effectiveType =
        storeContentType === 'characters'
          ? 'anime'
          : storeContentType === 'person'
            ? 'anime'
            : (storeContentType as MediaType);

      if (hikkaData?.data_type === 'character') {
        if (saved_mal_id) {
          mal_id = saved_mal_id;
        } else if (hikkaData?.anime_count > 0) {
          mal_id = (
            await (
              await fetch(`https://api.hikka.io/characters/${slug}/anime`)
            ).json()
          ).list[0].anime.mal_id;
        } else if (hikkaData?.manga_count > 0) {
          mal_id = (
            await (
              await fetch(`https://api.hikka.io/characters/${slug}/manga`)
            ).json()
          ).list[0].manga.mal_id;
        }
      }

      if (storeContentType === 'edit') {
        if (saved_mal_id) {
          mal_id = saved_mal_id;
        } else {
          const content_data = await hikkaEditContentFetcher();

          if (content_data.data_type === 'character') {
            if (content_data.anime_count > 0) {
              mal_id = (
                await (
                  await fetch(
                    `https://api.hikka.io/characters/${content_data.slug}/anime`,
                  )
                ).json()
              ).list[0].anime.mal_id;

              effectiveType = 'anime';
            } else if (content_data.manga_count > 0) {
              mal_id = (
                await (
                  await fetch(
                    `https://api.hikka.io/characters/${content_data.slug}/manga`,
                  )
                ).json()
              ).list[0].manga.mal_id;

              effectiveType = 'manga';
            }
          }
        }
      }

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
            mal_id,
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
    enabled: !!slug && !isLoading,
  });
};

export default useMediaCover;
