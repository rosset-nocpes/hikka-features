import { useQuery } from '@tanstack/react-query';

import { type ConvexWatchResult, convexApi } from '@/utils/convex-api';
import { convexAction } from '@/utils/convex-client';
import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/provider_classes';

const toEpisode = (
  episode: ConvexWatchResult['providers'][number]['sources'][number]['episodes'][number],
  isSub: boolean,
): API.EpisodeData => ({
  episode: episode.number,
  video_url: episode.playback.url,
  title: episode.title,
  airedAt: episode.airedAt,
  is_sub: isSub,
});

const toWatchData = (data: ConvexWatchResult): API.WatchData => {
  const out = {
    type: data.anime.mediaType === 'unknown' ? 'tv' : data.anime.mediaType,
  } as API.WatchData;

  for (const provider of data.providers) {
    const source = provider.sources[0];
    if (
      provider.sources.length === 1 &&
      source?.team.title === 'Main' &&
      source.translationType === 'unknown'
    ) {
      const value = new ProviderIFrame(provider.language as ProviderLanguage);
      value.episodes = source.episodes.map((episode) =>
        toEpisode(episode, false),
      );
      out[provider.id] = value;
      continue;
    }

    const value = new ProviderTeamIFrame(provider.language as ProviderLanguage);
    for (const source of provider.sources) {
      let displayTitle = source.team.title;
      if (value.teams[displayTitle]) {
        displayTitle = `${displayTitle} — ${
          source.translationType === 'sub' ? 'субтитри' : provider.id
        }`;
      }
      value.teams[displayTitle] = {
        id: source.team.id,
        logo: source.team.logo ?? '',
        canonicalTitle: source.team.title,
        translationType: source.translationType,
        episodes: source.episodes.map((episode) =>
          toEpisode(episode, source.translationType === 'sub'),
        ),
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
    queryFn: async () => {
      const data = await convexAction(convexApi.watch.resolve, {
        slug: slug!,
      });
      return toWatchData(data);
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });
};

export default useWatchData;
