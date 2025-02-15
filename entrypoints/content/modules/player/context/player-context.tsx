import {
  FC,
  PropsWithChildren,
  createContext,
  useContext,
  useState,
} from 'react';

interface UrlParams {
  sharedPlayerProvider: string | null;
  sharedPlayerTeam: string | null;
  sharedPlayerEpisode: string | null;
  sharedPlayerTime: string | null;
  sharedCheck: boolean;
}

interface PlayerContextType {
  playerState: PlayerState;
  setPlayerState: (
    state: PlayerState | ((prev: PlayerState) => PlayerState),
  ) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const getInitialState = (
  data: API.WatchData,
  urlParams: UrlParams,
  playersAvaliable: PlayerSource[],
  getWatched: () => number,
): PlayerState => {
  const provider =
    urlParams.sharedCheck &&
    playersAvaliable.includes(urlParams.sharedPlayerProvider as PlayerSource)
      ? (urlParams.sharedPlayerProvider as PlayerSource)
      : playersAvaliable[0];

  const team =
    urlParams.sharedCheck &&
    data[urlParams.sharedPlayerProvider!]?.[urlParams.sharedPlayerTeam!]
      ? urlParams.sharedPlayerTeam!
      : Object.keys(data[provider])[0];

  const episode =
    (urlParams.sharedCheck
      ? data[provider][team]?.find(
          (obj) => obj.episode === Number(urlParams.sharedPlayerEpisode),
        )
      : data[provider][team]?.find(
          (obj) => obj.episode === getWatched() + 1,
        )) ?? data[provider][team][0];

  return { provider, team, episode };
};

interface PlayerProviderProps extends PropsWithChildren {
  data: API.WatchData;
}

export const PlayerProvider: FC<PlayerProviderProps> = ({ children, data }) => {
  const [urlParams] = useState(() => {
    const path_params = new URLSearchParams(window.location.search);
    return {
      sharedPlayerProvider: path_params.get('playerProvider'),
      sharedPlayerTeam: path_params.get('playerTeam'),
      sharedPlayerEpisode: path_params.get('playerEpisode'),
      sharedPlayerTime: path_params.get('time'),
      sharedCheck: !!(
        path_params.get('playerProvider') &&
        path_params.get('playerTeam') &&
        path_params.get('playerEpisode')
      ),
    };
  });

  const [playerState, setPlayerState] = useState<PlayerState>(() =>
    getInitialState(data, urlParams, playersAvaliable(data), getWatched),
  );

  return (
    <PlayerContext.Provider value={{ playerState, setPlayerState }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};

export const playersAvaliable = (data: API.WatchData): PlayerSource[] =>
  Object.keys(data).filter((e) => e !== 'type') as PlayerSource[];

export const getWatched = () =>
  parseInt(
    document.body.querySelector('div.rounded-lg.border:nth-child(2) h3')
      ?.firstChild?.nodeValue!,
  );
