import { useQuery } from '@tanstack/react-query';
import useHikkaAnime from './use-hikka-anime';

const useRecommendation = () => {
  const { data } = useHikkaAnime();

  return useQuery({
    queryKey: ['recommendation-data', data.slug],
    queryFn: async () => {
      const mal_id = data['mal_id'];
      let maxSingleVotes = 0;

      const url = `https://corsproxy.io/?url=https://api.jikan.moe/v4/anime/${mal_id}/recommendations`;

      const r = await fetch(url);

      if (!r.ok) {
        throw new Error('Not found');
      }

      const recommendation_data = await r.json();
      const result = await Promise.all(
        recommendation_data.data.slice(0, 4).map(async (element: any) => {
          try {
            const hikkaData = await fetchDetailedData(element);
            if (element.votes > maxSingleVotes) maxSingleVotes = element.votes;
            return { ...hikkaData, mal: { ...element } };
          } catch (error) {
            await new Promise((resolve) => setTimeout(resolve, 700));
            const hikkaData = await fetchDetailedData(element);
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

const fetchDetailedData = async (content: any) => {
  const malId = content.entry.mal_id;
  const response = await fetch(
    `https://api.hikka.io/integrations/mal/anime/${malId}`,
  );
  if (!response.ok)
    throw new Error(`API request failed with status code ${response.status}`);
  return response.json();
};

export default useRecommendation;
