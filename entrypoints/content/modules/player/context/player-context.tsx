import type { FC, PropsWithChildren } from 'react';
import { create } from 'zustand';

interface PlayerState {
  /* Base */
  container?: HTMLElement;
  /* Player-related  */
  watchData?: API.WatchData; // todo: remove it from there
  provider?: PlayerSource;
  team?: string;
  episodeData?: API.EpisodeData[];
  currentEpisode?: API.EpisodeData;
  sidebarMode: 'offcanvas' | 'icon';
  /* Temporary */
  sharedParams?: SharedPlayerParams;
  isShared?: boolean;
}

interface PlayerActions {
  initialize: (data: API.WatchData) => void;
  setProvider: (provider: PlayerSource) => void;
  setTeam: (team: string) => void; // todo
  setEpisode: (episode: API.EpisodeData) => void;
  setSidebarMode: (mode: PlayerState['sidebarMode']) => void;
  setSharedStatus: (status: boolean) => void;
  setContainer: (container: HTMLElement) => void;
  reset: () => void;
}

export const usePlayer = create<PlayerState & PlayerActions>((set, get) => ({
  container: undefined,
  watchData: undefined,
  provider: undefined,
  team: undefined,
  episodeData: undefined,
  currentEpisode: undefined,
  sidebarMode: 'offcanvas',

  initialize: async (data) => {
    const providers_avaliable = getAvailablePlayers(data);
    const defaultPlayerValue = await defaultPlayer.getValue();

    const params = new URLSearchParams(window.location.search);
    const sharedParams: SharedPlayerParams = {
      provider: params.get('playerProvider'),
      team: params.get('playerTeam'),
      episode: params.get('playerEpisode'),
      time: params.get('time'),
    };

    const isShared = !!(
      sharedParams.provider &&
      sharedParams.team &&
      sharedParams.episode
    );

    // cleanup url
    const url = new URL(window.location.href);
    ['playerProvider', 'playerTeam', 'playerEpisode', 'time'].forEach((param) =>
      url.searchParams.delete(param),
    );

    history.replaceState(history.state, '', url.href);

    // Determine provider
    const provider =
      isShared &&
      providers_avaliable.includes(sharedParams.provider as PlayerSource)
        ? (sharedParams.provider as PlayerSource)
        : providers_avaliable.includes(defaultPlayerValue)
          ? defaultPlayerValue
          : providers_avaliable[0];

    // Determine team
    const team =
      isShared && data[provider]?.[sharedParams.team!]
        ? sharedParams.team!
        : Object.keys(data[provider])[0];

    const episodeData = data[provider][team];

    // Find episode
    const episodes = data[provider][team];
    const targetEpisode = isShared
      ? episodes?.find((ep) => ep.episode === Number(sharedParams.episode))
      : episodes?.find((ep) => ep.episode === getWatched() + 1);

    set({
      watchData: data,
      provider,
      team,
      episodeData,
      currentEpisode: targetEpisode ?? episodes[0],
      sidebarMode: 'offcanvas',
      sharedParams,
      isShared,
    });
  },
  setProvider: (provider) => {
    const { watchData } = get();
    if (!watchData) return;

    const newTeamName = Object.keys(watchData[provider])[0];
    const newEpisode =
      watchData[provider][newTeamName].find(
        (ep) => ep.episode === getWatched() + 1,
      ) || watchData[provider][newTeamName][0];

    const newEpisodeData = watchData[provider][newTeamName];

    set({
      provider,
      team: newTeamName,
      episodeData: newEpisodeData,
      currentEpisode: newEpisode,
    });
  },
  setTeam: (team) => {
    const { watchData, provider } = get();
    if (!watchData || !provider) return;

    const newEpisodeData = watchData[provider][team];

    const newEpisode =
      watchData[provider][team].find(
        (episode) => episode.episode === getWatched() + 1,
      ) || watchData[provider][team][0];

    set({ team, episodeData: newEpisodeData, currentEpisode: newEpisode });
  },
  setEpisode: (episode) => set({ currentEpisode: episode }),
  setSidebarMode: (mode) => set({ sidebarMode: mode }),
  setSharedStatus: (status) => set({ isShared: status }),
  setContainer: (container) => set({ container }),
  reset: () => {
    set({
      container: undefined,
      /* Player-related  */
      watchData: undefined,
      provider: undefined,
      team: undefined,
      episodeData: undefined,
      currentEpisode: undefined,
      sidebarMode: 'offcanvas',
      /* Temporary */
      sharedParams: undefined,
      isShared: undefined,
    });
  },
}));

interface SharedPlayerParams {
  provider: string | null;
  team: string | null;
  episode: string | null;
  time: string | null;
}

export const getAvailablePlayers = (data: API.WatchData): PlayerSource[] =>
  Object.keys(data).filter((key) => key !== 'type') as PlayerSource[];

export const getWatched = (): number => {
  const selector = 'div.rounded-lg.border:nth-child(2) span';
  const element = document.querySelector(selector);
  return element?.firstChild?.nodeValue
    ? parseInt(element.firstChild.nodeValue, 10)
    : 0;
};

interface PlayerProviderProps extends PropsWithChildren {
  container: HTMLElement;
}

export const PlayerProvider: FC<PlayerProviderProps> = ({ children }) => {
  const { initialize } = usePlayer();
  const { data } = useWatchData();

  useEffect(() => {
    if (!data) return;

    initialize(data);
  }, [data]);

  return <>{children}</>;
};
