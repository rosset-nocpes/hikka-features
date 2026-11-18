import { useQuery } from '@tanstack/react-query';

import useHikka, {
  fetchHikka,
  type HikkaContent,
  useHikkaContent,
} from '@/hooks/use-hikka';
import { usePageStore } from '@/hooks/use-page-store';
import { queryAniList } from '@/utils/anilist';

type CoverMedia = { malId: number; type: 'anime' | 'manga' };

/** A character's first anime, else their first manga. */
const findCharacterMedia = async (
  character: HikkaContent,
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
  const data = await queryAniList<{
    Media?: { bannerImage?: string | null } | null;
  }>(
    `query media($mal_id: Int, $type: MediaType) {
      Media(idMal: $mal_id, type: $type) {
        bannerImage
      }
    }`,
    { mal_id: malId, type: type.toUpperCase() },
  );
  return data.Media?.bannerImage ?? null;
};

/** The title whose banner covers the page, if it has one. */
const coverMedia = async (
  content: HikkaContent,
): Promise<CoverMedia | null> => {
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
      const media = await coverMedia(data!);
      return media && (await fetchBannerImage(media));
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    enabled: !!data && !isLoading,
  });
};

export default useMediaCover;
