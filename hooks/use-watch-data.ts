import { useQuery } from '@tanstack/react-query';
import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/provider_classes';
import useHikkaAnime from './use-hikka-anime';

// TODO: add types for api
const useWatchData = () => {
  const { data: anime_data } = useHikkaAnime();
  const { backendBranch } = useSettings();

  return useQuery({
    queryKey: ['watch-data', anime_data.slug],
    queryFn: async () => {
      const r = await fetch(
        `${BACKEND_BRANCHES[backendBranch]}/watch/v2/${anime_data.slug}`,
      );

      if (!r.ok) {
        throw new Error('Not found');
      }

      const data: API.WatchData = await r.json();
      const out = data;
      for (const [key, elem] of Object.entries(data)) {
        if (typeof elem === 'string') continue;

        if (elem.type === 'team-iframe') {
          out[key] = new ProviderTeamIFrame(out[key].lang);
          out[key].teams = (elem as ProviderTeamIFrame).teams || {};
          out[key].sortTeams();
        } else if (elem.type === 'iframe') {
          out[key] = new ProviderIFrame(out[key].lang);
          out[key].episodes = (elem as ProviderIFrame).episodes || [];
        }
      }

      return out as API.WatchData;
    },
    retry: false,
    staleTime: Infinity,
  });
};

export default useWatchData;
