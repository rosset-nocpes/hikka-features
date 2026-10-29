import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import type { ContentCardItem } from '@/components/hikka/content-card';

import type { ContentType } from './use-page-store';

import { HIKKA_API } from './use-hikka';

/**
 * What the recommendations page and its tab are called. hikka.io's tabs
 * just fit a title's header; a longer name would push "Обговорення" out.
 */
export const RECOMMENDATIONS_TAB = 'Схожі';

/** A title MAL users recommend with the page's, as its Hikka entry. */
export type Recommendation = ContentCardItem & { mal_id: number };

/** MAL keeps novels with manga. */
export const malType = (contentType?: ContentType) =>
  contentType === 'novel' ? 'manga' : contentType;

/** Where Hikka may have filed a MAL entry, the page's own type first. */
const HIKKA_TYPES: Partial<Record<ContentType, ContentType[]>> = {
  anime: ['anime'],
  manga: ['manga', 'novel'],
  novel: ['novel', 'manga'],
};

/** How many MAL ids Hikka looks up at once. */
const MAX_IDS = 500;

/** Hikka's entries for MAL ids, in their order, less those it doesn't have. */
const findOnHikka = async (contentType: ContentType, malIds: number[]) => {
  const found = new Map<number, Recommendation>();
  for (const type of HIKKA_TYPES[contentType] ?? []) {
    const missing = malIds.filter((id) => !found.has(id));
    if (missing.length === 0) break;
    const entries = await ky
      .post(`${HIKKA_API}/integrations/mal/${type}`, {
        json: { mal_ids: missing },
      })
      .json<(Recommendation | null)[]>();
    for (const entry of entries) {
      if (entry) found.set(entry.mal_id, entry);
    }
  }
  return malIds.flatMap((id) => found.get(id) ?? []);
};

/**
 * The titles MAL users recommend with the page's, most recommended first, as
 * Hikka entries. The block and the page share them.
 */
const useRecommendation = () => {
  const { contentType, slug } = usePageStore();
  const { data } = useHikka();
  const malId: number | undefined = data?.mal_id;

  return useQuery({
    queryKey: ['recommendations', contentType, slug],
    queryFn: async () => {
      const { data: recommendations } = await ky
        .get(
          `https://api.tenrai.org/v1/${malType(contentType)}/${malId}/recommendations`,
        )
        .json<{ data: Array<{ entry: { mal_id: number } }> }>();
      const ids = new Set(recommendations.map(({ entry }) => entry.mal_id));
      return findOnHikka(contentType!, [...ids].slice(0, MAX_IDS));
    },
    enabled: !!contentType && !!malId,
    retry: false,
    staleTime: Infinity,
  });
};

export default useRecommendation;
