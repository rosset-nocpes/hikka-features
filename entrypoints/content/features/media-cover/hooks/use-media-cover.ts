import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import useHikka, { fetchHikka, useHikkaContent } from '@/hooks/use-hikka';
import { usePageStore } from '@/hooks/use-page-store';

type CoverMedia = { malId: number; type: 'anime' | 'manga' };

const ANILIST_URL = 'https://graphql.anilist.co';

/** A character's first anime, else their first manga. */
const findCharacterMedia = async (
  character: any,
): Promise<CoverMedia | null> => {
  for (const type of ['anime', 'manga'] as const) {
    if (!character[`${type}_count`]) continue;
    const { list } = await fetchHikka<{
      list: Array<Partial<Record<typeof type, { mal_id: number }>>>;
    }>(`characters/${character.slug}/${type}`).catch(() => ({ list: [] }));
    const malId = list[0]?.[type]?.mal_id;
    if (malId) return { malId, type };
  }
  return null;
};

const fetchBannerImage = async ({ malId, type }: CoverMedia) => {
  const response = await ky.post(ANILIST_URL, {
    throwHttpErrors: false,
    json: {
      query: `
        query media($mal_id: Int, $type: MediaType) {
          Media(idMal: $mal_id, type: $type) {
            bannerImage
          }
        }
      `,
      variables: { mal_id: malId, type: type.toUpperCase() },
    },
  });
  if (!response.ok) return null;

  const json = await response.json<any>();
  return (json.data?.Media?.bannerImage as string | undefined) ?? null;
};

/** The title whose banner covers the page, if it has one. */
const coverMedia = async (content: any): Promise<CoverMedia | null> => {
  switch (content.data_type) {
    case 'anime':
      return content.mal_id ? { malId: content.mal_id, type: 'anime' } : null;
    case 'manga':
    case 'novel':
      return content.mal_id ? { malId: content.mal_id, type: 'manga' } : null;
    case 'character':
      return await findCharacterMedia(content);
    default:
      return null;
  }
};

/**
 * The content behind the page. An edit's page shows what it edits, whose
 * summary there lacks a character's counts, so a character is fetched.
 */
const usePageContent = () => {
  const { contentType } = usePageStore();
  const page = useHikka();
  const edited = contentType === 'edit' ? page.data?.content : undefined;
  const isCharacter = edited?.data_type === 'character';
  const character = useHikkaContent(
    isCharacter ? 'character' : undefined,
    edited?.slug,
  );
  if (!edited) return page;
  return isCharacter ? character : { data: edited, isLoading: false };
};

/** An AniList banner for the page: the title's, or a character's anime's. */
const useMediaCover = () => {
  const { data, isLoading } = usePageContent();

  return useQuery({
    queryKey: ['media-cover', data?.data_type, data?.slug],
    queryFn: async () => {
      const media = await coverMedia(data);
      return media && (await fetchBannerImage(media));
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    enabled: !!data && !isLoading,
  });
};

export default useMediaCover;
