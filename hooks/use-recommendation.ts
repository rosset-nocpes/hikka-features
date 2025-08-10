import { useQuery } from '@tanstack/react-query';
import type { ContentType } from './use-page-store';

const useRecommendation = () => {
  const { contentType: content_type } = usePageStore();
  const data = useHikka().data;

  return useQuery({
    queryKey: ['recommendation-data', data.slug],
    queryFn: async () => {
      const mal_id = data.mal_id;
      let maxSingleVotes = 0;

      const url = `https://corsproxy.io/?url=https://api.jikan.moe/v4/${content_type === 'novel' ? 'manga' : content_type}/${mal_id}/recommendations`;

      const r = await fetch(url);

      if (!r.ok) {
        throw new Error('Not found');
      }

      const recommendation_data = await r.json();
      const result = await Promise.all(
        recommendation_data.data.slice(0, 4).map(async (element: any) => {
          try {
            const hikkaData = await fetchDetailedData(content_type!, element);
            if (element.votes > maxSingleVotes) maxSingleVotes = element.votes;
            return { ...hikkaData, mal: { ...element } };
          } catch (error) {
            await new Promise((resolve) => setTimeout(resolve, 700));
            const hikkaData = await fetchDetailedData(content_type!, element);
            if (element.votes > maxSingleVotes) maxSingleVotes = element.votes;
            return { ...hikkaData, mal: { ...element } };
          }
        }),
      );

      // if (recommendation_data === null) {
      //   throw new Error('Not found');
      // }

      return { recommendations: result, maxSingleVotes };
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

const fetchDetailedData = async (content_type: ContentType, content: any) => {
  const malId = content.entry.mal_id;

  const endpoints = [
    `https://api.hikka.io/integrations/mal/${content_type}/${malId}`,
    ...(content_type === 'novel'
      ? [`https://api.hikka.io/integrations/mal/manga/${malId}`]
      : content_type === 'manga'
        ? [`https://api.hikka.io/integrations/mal/novel/${malId}`]
        : []),
  ];

  let lastError = new Error('Unknown fetch error');

  for (const url of endpoints) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();

      lastError = new Error(
        `[use-recommendation]: API request failed with status code ${response.status}`,
      );
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw lastError;
};

export default useRecommendation;
