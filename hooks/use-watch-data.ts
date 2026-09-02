import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/provider_classes';

// TODO: add types for api
const useWatchData = () => {
  const { backendBranch } = useSettings();
  const { slug } = usePageStore();

  return useQuery({
    queryKey: ['watch-data', slug],
    queryFn: async () => {
      const data = await ky
        .get(`${BACKEND_BRANCHES[backendBranch]}/watch/v2/${slug}`)
        .json<API.WatchData>();
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
    enabled: !!slug,
  });
};

export default useWatchData;
