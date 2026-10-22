import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import type { ContentType } from './use-page-store';

import { fetchHikka } from './use-hikka';

/** MAL keeps novels with manga. */
const malType = (contentType?: ContentType) =>
  contentType === 'novel' ? 'manga' : contentType;

/** The Hikka entry for a MAL id, which may be filed as the other print type. */
const findOnHikka = async (contentType: ContentType, malId: number) => {
  const types =
    contentType === 'novel'
      ? ['novel', 'manga']
      : contentType === 'manga'
        ? ['manga', 'novel']
        : [contentType];
  let lastError: unknown;
  for (const type of types) {
    try {
      return await fetchHikka(`integrations/mal/${type}/${malId}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

/** Hikka rate-limits bursts; one more try after a pause. */
const withRetry = async <T>(request: () => Promise<T>) => {
  try {
    return await request();
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return await request();
  }
};

/** MAL's top five recommendations for the page's title, as Hikka entries. */
const useRecommendation = () => {
  const { contentType, slug } = usePageStore();
  const { data, isLoading } = useHikka();

  return useQuery({
    queryKey: ['recommendation-data', slug],
    queryFn: async () => {
      const { data: recommendations } = await ky
        .get(
          `https://api.tenrai.org/v1/${malType(contentType)}/${data.mal_id}/recommendations`,
        )
        .json<{ data: Array<{ entry: { mal_id: number } }> }>();
      return {
        recommendations: await Promise.all(
          recommendations
            .slice(0, 5)
            .map(({ entry }) =>
              withRetry(() => findOnHikka(contentType!, entry.mal_id)),
            ),
        ),
      };
    },
    enabled: !isLoading && !!data,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useRecommendation;
