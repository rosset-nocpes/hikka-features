import { createContext, FC, PropsWithChildren } from 'react';

interface SharedPlayerParams {
  provider: string | null;
  team: string | null;
  episode: string | null;
  time: string | null;
}

interface PlayerContextType {
  state: PlayerState;
  setState: (state: PlayerState | ((prev: PlayerState) => PlayerState)) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const useSharedPlayerParams = (): [SharedPlayerParams, boolean] => {
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
  return [sharedParams, isShared];
};

export const getAvailablePlayers = (data: API.WatchData): PlayerSource[] =>
  Object.keys(data).filter((key) => key !== 'type') as PlayerSource[];

// Backward compatibility
export const playersAvaliable = getAvailablePlayers;

export const getWatched = (): number => {
  const selector = 'div.rounded-lg.border:nth-child(2) span';
  const element = document.querySelector(selector);
  return element?.firstChild?.nodeValue
    ? parseInt(element.firstChild.nodeValue, 10)
    : 0;
};

const getInitialPlayerState = (
  data: API.WatchData,
  container: HTMLElement,
  sharedParams: SharedPlayerParams,
  isShared: boolean,
): PlayerState => {
  const availablePlayers = getAvailablePlayers(data);

  // Determine provider
  const provider =
    isShared && availablePlayers.includes(sharedParams.provider as PlayerSource)
      ? (sharedParams.provider as PlayerSource)
      : availablePlayers[0];

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

  return {
    provider,
    team,
    episodeData,
    currentEpisode: targetEpisode ?? episodes[0],
    sidebarMode: 'offcanvas',
    container,
  };
};

interface PlayerProviderProps extends PropsWithChildren {
  container: HTMLElement;
}

export const PlayerProvider: FC<PlayerProviderProps> = ({
  children,
  container,
}) => {
  const [sharedParams, isShared] = useSharedPlayerParams();
  const { data } = useWatchData();

  const [playerState, setPlayerState] = useState<PlayerState>(() =>
    getInitialPlayerState(data!, container, sharedParams, isShared),
  );

  return (
    <PlayerContext.Provider
      value={{ state: playerState, setState: setPlayerState }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};
