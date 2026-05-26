import {
  createRef,
  type FC,
  type PropsWithChildren,
  RefObject,
  useEffect,
} from 'react';
import { create } from 'zustand';

import { useSidebar } from '@/components/ui/sidebar';
import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/provider_classes';

interface PlayerState {
  /* Base */
  container?: HTMLElement;
  /* Player-related  */
  watchData?: API.WatchData; // todo: remove it from there
  watchDataKey?: string;
  provider?: string;
  team?: API.TeamData;
  favoriteTeam?: FavoriteTeam;
  episodeData?: API.EpisodeData[];
  currentEpisode?: API.EpisodeData;
  fullscreen: boolean;
  theatreMode: boolean;
  miniPlayer: boolean;
  miniPlayerCorner: MiniPlayerCorner;
  overlayRef: RefObject<HTMLDivElement | null>;
  /* Temporary */
  sharedParams?: SharedPlayerParams;
  isShared?: boolean;
}

interface PlayerActions {
  initialize: (data: API.WatchData) => void;
  setProvider: (provider: string) => void;
  setTeam: (team: API.TeamData) => void; // todo
  setFavoriteTeam: (team: string) => void;
  removeFavoriteTeam: () => void;
  setEpisode: (episode: API.EpisodeData) => void;
  toggleFullscreen: () => void;
  toggleTheatreMode: () => void;
  toggleMiniPlayer: () => void;
  setMiniPlayer: (status: boolean) => void;
  setMiniPlayerCorner: (corner: MiniPlayerCorner) => void;
  setSharedStatus: (status: boolean) => void;
  setContainer: (container: HTMLElement) => void;
  setOverlayRef: (ref: HTMLDivElement | null) => void;
  reset: () => void;
}

export const usePlayer = create<PlayerState & PlayerActions>((set, get) => {
  const handleFullscreenChange = () => {
    const wrapper = get().container?.querySelector('#player-frame');

    if (!document.fullscreenElement) {
      set({ fullscreen: false });
      wrapper?.classList.remove('fullscreen');
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
  };

  return {
    container: undefined,
    watchData: undefined,
    provider: undefined,
    team: undefined,
    favoriteTeam: undefined,
    episodeData: undefined,
    currentEpisode: undefined,
    fullscreen: false,
    theatreMode: false,
    miniPlayer: false,
    miniPlayerCorner: 'bottom-right',
    overlayRef: createRef<HTMLDivElement>(),

    initialize: async (data) => {
      const watchDataKey = getWatchDataKey(data);
      if (get().watchDataKey === watchDataKey) return;

      const { defaultProvider, favoriteTeams } =
        useSettings.getState().features.player;

      const providers_avaliable = getAvailablePlayers(data).map((e) => e.title);
      const { slug } = usePageStore.getState();
      const favoriteTeam = favoriteTeams[slug!];

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
      ['playerProvider', 'playerTeam', 'playerEpisode', 'time'].map((param) =>
        url.searchParams.delete(param),
      );

      history.replaceState(history.state, '', url.href);

      // Determine provider
      const provider =
        isShared && providers_avaliable.includes(sharedParams.provider!)
          ? sharedParams.provider!
          : favoriteTeam
            ? favoriteTeam.provider
            : providers_avaliable.includes(defaultProvider)
              ? defaultProvider
              : providers_avaliable[0];

      // Determine team
      let team: API.TeamData = {
        title: '',
        logo: '',
      };
      if (data[provider] instanceof ProviderTeamIFrame) {
        const first_team = data[provider].getTeams()[0];

        if (isShared && data[provider].teams[sharedParams.team!]) {
          team = data[provider].getTeam(sharedParams.team!);
        } else if (
          favoriteTeam &&
          (data[favoriteTeam.provider] as ProviderTeamIFrame).teams[
            favoriteTeam.team
          ]
        ) {
          team = (data[favoriteTeam.provider] as ProviderTeamIFrame).getTeam(
            favoriteTeam.team,
          );
        } else {
          team = first_team;
        }
      }

      const episodeData =
        data[provider] instanceof ProviderTeamIFrame
          ? data[provider].teams[team.title].episodes
          : data[provider].episodes;

      const targetEpisode = isShared
        ? episodeData?.find((ep) => ep.episode === Number(sharedParams.episode))
        : episodeData?.find((ep) => ep.episode === getWatched() + 1);

      set({
        watchData: data,
        watchDataKey,
        provider,
        team,
        favoriteTeam,
        episodeData,
        currentEpisode: targetEpisode ?? episodeData[0],
        sharedParams,
        isShared,
      });
    },
    setProvider: (provider) => {
      const { watchData } = get();
      if (!watchData) return;

      const newTeamName =
        watchData[provider] instanceof ProviderTeamIFrame
          ? {
              title: Object.keys(watchData[provider].teams)[0],
              logo: watchData[provider].teams[
                Object.keys(watchData[provider].teams)[0]
              ].logo,
            }
          : { title: '', logo: '' };
      const newEpisode =
        watchData[provider] instanceof ProviderTeamIFrame
          ? watchData[provider].teams[newTeamName.title].episodes.find(
              (ep) => ep.episode === getWatched() + 1,
            ) || watchData[provider].teams[newTeamName.title].episodes[0]
          : watchData[provider].episodes.find(
              (ep) => ep.episode === getWatched() + 1,
            ) || watchData[provider].episodes[0];

      const newEpisodeData =
        watchData[provider] instanceof ProviderTeamIFrame
          ? watchData[provider].teams[newTeamName.title].episodes
          : watchData[provider].episodes;

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
      if (!(watchData[provider] instanceof ProviderTeamIFrame)) return;

      const newEpisodeData = watchData[provider].teams[team.title].episodes;

      const newEpisode =
        newEpisodeData.find(
          (episode) => episode.episode === getWatched() + 1,
        ) || newEpisodeData[0];

      set({ team, episodeData: newEpisodeData, currentEpisode: newEpisode });
    },
    setFavoriteTeam: (team) => {
      const { slug } = usePageStore.getState();
      const provider = get().provider!;
      if (!slug) return;

      const newTeam = {
        provider,
        team,
      };

      const { favoriteTeams } = useSettings.getState().features.player;
      const { updateFeatureSettings } = useSettings.getState();

      const updated = { ...favoriteTeams, [slug]: newTeam };
      updateFeatureSettings('player', { favoriteTeams: updated });

      set({ favoriteTeam: newTeam });
    },
    removeFavoriteTeam: () => {
      const { favoriteTeams } = useSettings.getState().features.player;
      const { updateFeatureSettings } = useSettings.getState();
      const { slug } = usePageStore.getState();
      if (!slug) return;

      const updated = { ...favoriteTeams };
      delete updated[slug];
      updateFeatureSettings('player', { favoriteTeams: updated });

      set({ favoriteTeam: undefined });
    },
    setEpisode: (episode) => set({ currentEpisode: episode }),
    toggleFullscreen: () => {
      const { fullscreen } = get();
      const wrapper = get().container?.querySelector('#player-frame');

      if (fullscreen) {
        set({ fullscreen: false });
        wrapper?.classList.remove('fullscreen');
        document.exitFullscreen();
        document.removeEventListener(
          'fullscreenchange',
          handleFullscreenChange,
        );
      } else {
        set({ fullscreen: true, miniPlayer: false });
        wrapper?.classList.add('fullscreen');
        document.documentElement.requestFullscreen();
        document.addEventListener('fullscreenchange', handleFullscreenChange);
      }
    },
    toggleTheatreMode: () => {
      const { theatreMode } = get();
      set({ theatreMode: !theatreMode, miniPlayer: false });
    },
    toggleMiniPlayer: () => {
      const { fullscreen, miniPlayer, toggleFullscreen } = get();

      if (fullscreen) toggleFullscreen();

      set({
        theatreMode: false,
        miniPlayer: !miniPlayer,
      });
    },
    setMiniPlayer: (status) => {
      const { fullscreen, theatreMode, toggleFullscreen } = get();

      if (status && fullscreen) toggleFullscreen();

      set({
        theatreMode: status ? false : theatreMode,
        miniPlayer: status,
      });
    },
    setMiniPlayerCorner: (corner) => set({ miniPlayerCorner: corner }),
    setSharedStatus: (status) => set({ isShared: status }),
    setContainer: (container) => set({ container }),
    setOverlayRef: (el) => {
      const ref = createRef<HTMLDivElement>();
      ref.current = el;

      if (el) {
        let hideTimer: NodeJS.Timeout;

        const resetTimer = () => {
          useIFramePlayer.setState({ uiShown: true });
          clearTimeout(hideTimer);
          hideTimer = setTimeout(() => {
            if (!useIFramePlayer.getState().isPlaying) return;
            useIFramePlayer.setState({ uiShown: false });
          }, 4000);
        };

        const resetTimerForMouse = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') return;
          resetTimer();
        };

        const resetTimerForVisibleTouchUi = (event: PointerEvent) => {
          if (event.pointerType === 'mouse') return;
          if (!useIFramePlayer.getState().uiShown) return;
          resetTimer();
        };

        const handlePointerLeave = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') return;
          clearTimeout(hideTimer);
          hideTimer = setTimeout(() => {
            if (!useIFramePlayer.getState().isPlaying) return;
            useIFramePlayer.setState({ uiShown: false });
          }, 4000);
        };

        el.addEventListener('pointerenter', resetTimerForMouse);
        el.addEventListener('pointermove', resetTimerForMouse);
        el.addEventListener('pointerdown', resetTimerForVisibleTouchUi);
        el.addEventListener('pointerleave', handlePointerLeave);
      }

      set({ overlayRef: ref });
    },

    reset: () => {
      set({
        container: undefined,
        /* Player-related  */
        watchData: undefined,
        watchDataKey: undefined,
        provider: undefined,
        team: undefined,
        episodeData: undefined,
        currentEpisode: undefined,
        fullscreen: false,
        theatreMode: false,
        miniPlayer: false,
        miniPlayerCorner: 'bottom-right',
        /* Temporary */
        sharedParams: undefined,
        isShared: undefined,
      });
    },
  };
});

interface SharedPlayerParams {
  provider: string | null;
  team: string | null;
  episode: string | null;
  time: string | null;
}

interface FavoriteTeam {
  provider: string;
  team: string;
}

export type MiniPlayerCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export const getAvailablePlayers = (data: API.WatchData) =>
  Object.entries(data)
    .filter(([key]) => key !== 'type')
    .map(([key, entry]: [string, any]) => ({
      title: key,
      lang: entry.lang as ProviderLanguage,
    }));

const getEpisodeKey = (episode: API.EpisodeData) => [
  episode.episode,
  episode.video_url,
];

const getWatchDataKey = (data: API.WatchData) =>
  JSON.stringify([
    data.type,
    ...Object.entries(data)
      .filter(([key]) => key !== 'type')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([provider, entry]) => {
        if (entry instanceof ProviderTeamIFrame) {
          return [
            provider,
            entry.type,
            entry.lang,
            Object.entries(entry.teams)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([team, teamData]) => [
                team,
                teamData.logo,
                teamData.episodes.map(getEpisodeKey),
              ]),
          ];
        }

        if (entry instanceof ProviderIFrame) {
          return [
            provider,
            entry.type,
            entry.lang,
            entry.episodes.map(getEpisodeKey),
          ];
        }

        return [provider, entry];
      }),
  ]);

export const getWatched = (): number => {
  const selector =
    '.grid > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div:nth-of-type(2) span';
  const element = document.querySelector(selector);
  return element?.firstChild?.nodeValue
    ? parseInt(element.firstChild.nodeValue, 10)
    : 0;
};

interface PlayerProviderProps extends PropsWithChildren {
  container: HTMLElement;
}

export const PlayerProvider: FC<PlayerProviderProps> = ({ children }) => {
  const { fullscreen } = usePlayer();
  const { setOpen } = useSidebar();

  // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  useEffect(() => setOpen(!fullscreen), [fullscreen]);

  return <>{children}</>;
};
