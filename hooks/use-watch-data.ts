import { queryOptions, useQuery } from '@tanstack/react-query';

import {
  type ConvexWatchResult,
  type ConvexWatchSource,
  convexApi,
} from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';
import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/providers';

const toWatchData = (data: ConvexWatchResult): API.WatchData => {
  const info = new Map(
    data.episodes.map((episode) => [episode.number, episode]),
  );
  const toEpisodes = (
    episodes: ConvexWatchSource['episodes'],
  ): API.EpisodeData[] =>
    episodes.map(({ number, url, releasedAt }) => ({
      episode: number,
      video_url: url,
      title: info.get(number)?.title,
      episode_type: info.get(number)?.type,
      releasedAt,
    }));

  const out = {
    type: data.anime.mediaType === 'unknown' ? 'tv' : data.anime.mediaType,
  } as API.WatchData;

  for (const provider of data.providers) {
    const [first] = provider.sources;
    if (first && !first.team) {
      const value = new ProviderIFrame(provider.language);
      value.episodes = toEpisodes(first.episodes);
      out[provider.id] = value;
      continue;
    }

    const value = new ProviderTeamIFrame(provider.language);
    for (const { team, translationType, episodes } of provider.sources) {
      if (!team) continue;
      // The title doubles as the key (favourites and share links store it),
      // so a team listed for both dub and sub needs a suffix on its second
      // entry. UIs show `canonicalTitle` instead (see getTeamName).
      const title = value.teams[team.title]
        ? `${team.title} — ${translationType === 'sub' ? 'субтитри' : 'озвучення'}`
        : team.title;
      value.teams[title] = {
        id: team.id,
        slug: team.slug,
        logo: team.logo ?? '',
        canonicalTitle: team.title,
        translationType,
        episodes: toEpisodes(episodes),
      };
    }
    if (Object.keys(value.teams).length === 0) continue;
    value.sortTeams();
    out[provider.id] = value;
  }
  return out;
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
