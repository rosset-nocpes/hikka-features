import { useQuery } from '@tanstack/react-query';

const useAmanogawaUrl = (anime_data: any) => {
  return useQuery({
    queryKey: ['amanogawa-url', anime_data?.slug],
    queryFn: async () => {
      const threshold = 0.8; // Значення -> [0; 1]. Це рівень перевірки схожості назви аніме, тому що пошук на amanogawa працює дуже дивно й іноді видає аніме, які взагалі не потрібні були.

      const title_ja = anime_data.title_ja;
      const title_year = anime_data.year;

      const url_cors_proxy_amanogawa =
        'https://corsproxy.io/?url=' +
        encodeURIComponent(
          `https://amanogawa.space/api/search?s="${encodeURIComponent(
            title_ja.replaceAll('"', "'"),
          )}"`,
        );

      const r = await fetch(url_cors_proxy_amanogawa);

      if (!r.ok) {
        throw new Error('Not found');
      }

      const amanogawa_data = await r.json();

      const anime: any = findMostSimilarEnJpName(
        title_ja,
        title_year,
        amanogawa_data,
        threshold,
      );

      if (anime === null) {
        throw new Error('Not found');
      }

      return `https://amanogawa.space/anime/${anime.id}`;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useAmanogawaUrl;
