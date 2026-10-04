import { useQuery } from '@tanstack/react-query';

import { type ConvexWatchResult, convexApi } from '@/utils/convex-api';
import { publicAction } from '@/utils/convex-client';
import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/provider_classes';

const toWatchData = (data: ConvexWatchResult): API.WatchData => {
  const info = new Map(
    data.episodes.map((episode) => [episode.number, episode]),
  );
  const toEpisodes = (
    episodes: ConvexWatchResult['providers'][number]['sources'][number]['episodes'],
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
    const language = provider.language as ProviderLanguage;
    const [first] = provider.sources;
    if (first && !first.team) {
      const value = new ProviderIFrame(language);
      value.episodes = toEpisodes(first.episodes);
      out[provider.id] = value;
      continue;
    }

    const value = new ProviderTeamIFrame(language);
    for (const { team, translationType, episodes } of provider.sources) {
      if (!team) continue;
      const title = value.teams[team.title]
        ? `${team.title} — ${translationType === 'sub' ? 'субтитри' : 'озвучення'}`
        : team.title;
      value.teams[title] = {
        id: team.id,
        logo: team.logo ?? '',
        canonicalTitle: team.title,
        translationType,
        episodes: toEpisodes(episodes),
      };
    }
    value.sortTeams();
    out[provider.id] = value;
  }
  return out;
};

const useWatchData = () => {
  const { slug } = usePageStore();

  return useQuery({
    queryKey: ['watch-data', slug],
    queryFn: async () =>
      toWatchData(await publicAction(convexApi.watch.resolve, { slug: slug! })),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });
};

export default useWatchData;
