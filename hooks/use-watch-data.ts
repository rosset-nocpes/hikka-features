import { queryOptions, useQuery } from '@tanstack/react-query';

import { type ConvexWatchResponse, convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';

const toWatchData = (data: ConvexWatchResponse): API.WatchData => {
  const info = new Map(
    data.episodes.map((episode) => [episode.number, episode]),
  );

  return {
    type: data.anime.mediaType === 'unknown' ? 'tv' : data.anime.mediaType,
    providers: data.providers,
    teams: data.teams.map(({ key, team, translationType, episodes }) => ({
      key,
      id: team.id,
      slug: team.slug,
      title: team.title,
      logo: team.logo ?? '',
      translationType,
      sources: episodes.flatMap(({ number, sources }) =>
        sources.map(({ provider, url, releasedAt }) => ({
          episode: number,
          video_url: url,
          provider,
          title: info.get(number)?.title,
          episode_type: info.get(number)?.type,
          releasedAt,
        })),
      ),
    })),
  };
};

/** An anime's watch data, for its page's player and for the queue. */
export const watchDataQuery = (slug?: string) =>
  queryOptions({
    queryKey: ['watch-data', slug],
    queryFn: async () =>
      toWatchData(
        await convex.action(convexApi.watch.resolve, { slug: slug! }),
      ),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });

const useWatchData = () => {
  const { slug } = usePageStore();

  return useQuery(watchDataQuery(slug));
};

export default useWatchData;
