import { create } from 'zustand';

import { playerControls } from '@/hooks/use-iframe-player';
import { account } from '@/utils/account';
import { hikkaTracker } from '@/utils/hikka-tracker';
import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/provider_classes';

import { pickPriorityTeam, providersOf } from '../teams';

interface PlayerState {
  /* Base */
  container?: HTMLElement;
  /* Player-related  */
  watchData?: API.WatchData; // todo: remove it from there
  watchDataKey?: string;
  slug?: string;
  provider?: string;
  team?: API.TeamData;
  favoriteTeam?: FavoriteTeam;
  episodeData?: API.EpisodeData[];
  currentEpisode?: API.EpisodeData;
  fullscreen: boolean;
  theatreMode: boolean;
  miniPlayer: boolean;
  miniPlayerCorner: MiniPlayerCorner;
  videoPiPActive: boolean;
  /** The video's overlay, where gestures land and menus stay inside. */
  overlay: HTMLDivElement | null;
  /* Temporary */
  sharedParams?: SharedPlayerParams;
  isShared?: boolean;
  /** Watch together room code from an invite link. */
  roomInvite?: string;
  /** The invite was accepted before the page opened, e.g. from a toast. */
  roomInviteAccepted?: boolean;
}

interface PlayerActions {
  initialize: (data: API.WatchData) => void;
  setProvider: (provider: string) => void;
  setTeam: (team: API.TeamData) => void;
  /** Makes the team this anime's favourite, or stops it being one. */
  toggleFavoriteTeam: (team: API.TeamData) => void;
  setEpisode: (episode: API.EpisodeData) => void;
  /** Shows exactly this source and episode; false when it isn't available. */
  selectSource: (provider: string, team: string, episode: number) => boolean;
  dismissRoomInvite: () => void;
  toggleFullscreen: () => void;
  toggleTheatreMode: () => void;
  toggleMiniPlayer: () => void;
  setMiniPlayer: (status: boolean) => void;
  setMiniPlayerCorner: (corner: MiniPlayerCorner) => void;
  setVideoPiPActive: (status: boolean) => void;
  setSharedStatus: (status: boolean) => void;
  setContainer: (container: HTMLElement) => void;
  setOverlay: (overlay: HTMLDivElement | null) => void;
}

/** The team of providers that don't split playback by team. */
const NO_TEAM: API.TeamData = { title: '', logo: '' };

/** URL parameters of share and invite links, removed once read. */
const LINK_PARAMS = [
  'playerProvider',
  'playerTeam',
  'playerEpisode',
  'time',
  'room',
  'join',
];

const teamOf = (data: API.WatchData, provider: string, team: string) => {
  const source = data[provider];
  return source instanceof ProviderTeamIFrame ? source.getTeam(team) : NO_TEAM;
};

/** A provider's episodes by `team`; providers without teams ignore it. */
export const episodesOf = (
  data: API.WatchData,
  provider: string,
  team: string,
) => {
  const source = data[provider];
  if (source instanceof ProviderTeamIFrame) return source.teams[team]?.episodes;
  if (source instanceof ProviderIFrame) return source.episodes;
  return undefined;
};

/** The episode after the user's progress on hikka.io, else the first. */
const nextUnwatched = (episodes: API.EpisodeData[]) =>
  episodes.find((episode) => episode.episode === hikkaTracker.progress + 1) ??
  episodes[0];

/** The team the user's priority picks on `provider`, else its first one. */
const priorityTeam = (data: API.WatchData, provider: string) => {
  const source = data[provider];
  if (!(source instanceof ProviderTeamIFrame)) return NO_TEAM;
  const { teamPriority, teamPriorityTranslation } =
    useSettings.getState().features.player;
  return (
    pickPriorityTeam(
      data,
      [provider],
      teamPriority,
      teamPriorityTranslation,
      hikkaTracker.progress + 1,
    )?.team ?? source.getTeams()[0]!
  );
};

export const isFavoriteTeam = (
  { favoriteTeam, provider }: Pick<PlayerState, 'favoriteTeam' | 'provider'>,
  team: API.TeamData,
) => favoriteTeam?.provider === provider && favoriteTeam?.team === team.title;

export const usePlayer = create<PlayerState & PlayerActions>((set, get) => {
  const handleFullscreenChange = () => {
    if (document.fullscreenElement) return;
    set({ fullscreen: false });
    get()
      .container?.querySelector('#player-frame')
      ?.classList.remove('fullscreen');
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  };

  const setFavoriteTeam = (slug: string, favorite?: FavoriteTeam) => {
    const { favoriteTeams } = useSettings.getState().features.player;
    const { [slug]: _previous, ...others } = favoriteTeams;
    useSettings.getState().updateFeatureSettings('player', {
      favoriteTeams: favorite ? { ...others, [slug]: favorite } : others,
    });
    set({ favoriteTeam: favorite });
  };

  return {
    fullscreen: false,
    theatreMode: false,
    miniPlayer: false,
    miniPlayerCorner: 'bottom-right',
    videoPiPActive: false,
    overlay: null,

    initialize: (data) => {
      const watchDataKey = getWatchDataKey(data);
      if (get().watchDataKey === watchDataKey) return;

      const {
        defaultProvider,
        favoriteTeams,
        teamPriority,
        teamPriorityTranslation,
      } = useSettings.getState().features.player;

      const available = providersOf(data).map(({ title }) => title);
      const { slug } = usePageStore.getState();
      const storedFavoriteTeam = favoriteTeams[slug!];

      const params = new URLSearchParams(window.location.search);
      const sharedParams: SharedPlayerParams = {
        provider: params.get('playerProvider'),
        team: params.get('playerTeam'),
        episode: params.get('playerEpisode'),
        time: params.get('time'),
      };

      // Teamless providers share an empty playerTeam.
      const isShared =
        !!sharedParams.provider &&
        sharedParams.team !== null &&
        !!sharedParams.episode;

      const roomInvite = params.get('room') ?? undefined;
      const roomInviteAccepted = params.has('join');

      const url = new URL(window.location.href);
      LINK_PARAMS.forEach((param) => url.searchParams.delete(param));
      history.replaceState(history.state, '', url.href);

      // A shared link wins, then this anime's favourite team, then the team
      // priority list, then the default provider's first team.
      const providerOrder = available.includes(defaultProvider)
        ? [
            defaultProvider,
            ...available.filter((name) => name !== defaultProvider),
          ]
        : available;
      const sharedProvider =
        isShared && available.includes(sharedParams.provider!)
          ? sharedParams.provider!
          : undefined;
      const favoriteSource =
        storedFavoriteTeam && data[storedFavoriteTeam.provider];
      const favoriteDisplayTeam =
        favoriteSource instanceof ProviderTeamIFrame
          ? favoriteSource
              .getTeams()
              .find(
                (candidate) =>
                  candidate.title === storedFavoriteTeam!.team ||
                  candidate.canonicalTitle === storedFavoriteTeam!.team,
              )
          : undefined;
      const priorityPick =
        sharedProvider || favoriteDisplayTeam
          ? undefined
          : pickPriorityTeam(
              data,
              providerOrder,
              teamPriority,
              teamPriorityTranslation,
              hikkaTracker.progress + 1,
            );

      const provider =
        sharedProvider ??
        (favoriteDisplayTeam && storedFavoriteTeam!.provider) ??
        priorityPick?.provider ??
        providerOrder[0]!;

      let team = NO_TEAM;
      let favoriteTeam = storedFavoriteTeam;
      const source = data[provider];
      if (source instanceof ProviderTeamIFrame) {
        if (isShared && source.teams[sharedParams.team!]) {
          team = source.getTeam(sharedParams.team!);
        } else if (
          favoriteDisplayTeam &&
          provider === storedFavoriteTeam!.provider
        ) {
          team = favoriteDisplayTeam;
          favoriteTeam = { provider, team: favoriteDisplayTeam.title };
        } else {
          team = priorityPick?.team ?? source.getTeams()[0]!;
        }
      }

      const episodeData = episodesOf(data, provider, team.title)!;
      const sharedEpisode = isShared
        ? episodeData.find((ep) => ep.episode === Number(sharedParams.episode))
        : undefined;

      set({
        watchData: data,
        watchDataKey,
        slug,
        provider,
        team,
        favoriteTeam,
        episodeData,
        currentEpisode: sharedEpisode ?? nextUnwatched(episodeData),
        sharedParams,
        isShared,
        roomInvite,
        roomInviteAccepted,
      });
    },
    setProvider: (provider) => {
      const { watchData } = get();
      if (!watchData) return;

      const team = priorityTeam(watchData, provider);
      const episodeData = episodesOf(watchData, provider, team.title)!;
      setSpeedOptions(provider);
      set({
        provider,
        team,
        episodeData,
        currentEpisode: nextUnwatched(episodeData),
      });
    },
    setTeam: (team) => {
      const { watchData, provider } = get();
      if (!watchData || !(watchData[provider!] instanceof ProviderTeamIFrame)) {
        return;
      }

      const episodeData = episodesOf(watchData, provider!, team.title)!;
      set({ team, episodeData, currentEpisode: nextUnwatched(episodeData) });
    },
    toggleFavoriteTeam: (team) => {
      const { slug } = usePageStore.getState();
      const { provider, watchData } = get();
      if (!slug || !provider) return;

      if (isFavoriteTeam(get(), team)) {
        setFavoriteTeam(slug);
        account.removeFavorite(slug).catch(console.error);
        return;
      }

      setFavoriteTeam(slug, { provider, team: team.title });
      const selected = watchData && teamOf(watchData, provider, team.title);
      account
        .saveFavorite({
          animeSlug: slug,
          provider,
          teamId: selected?.id,
          teamTitle: selected?.canonicalTitle ?? team.title,
          translationType: selected?.translationType,
        })
        .catch(console.error);
    },
    setEpisode: (episode) => set({ currentEpisode: episode }),
    selectSource: (provider, team, episode) => {
      const { watchData } = get();
      const episodeData = watchData && episodesOf(watchData, provider, team);
      const currentEpisode = episodeData?.find((ep) => ep.episode === episode);
      if (!currentEpisode) return false;

      if (provider !== get().provider) setSpeedOptions(provider);
      set({
        provider,
        team: teamOf(watchData!, provider, team),
        episodeData,
        currentEpisode,
      });
      return true;
    },
    dismissRoomInvite: () =>
      set({ roomInvite: undefined, roomInviteAccepted: undefined }),
    toggleFullscreen: () => {
      const wrapper = get().container?.querySelector('#player-frame');

      if (get().fullscreen) {
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
    toggleTheatreMode: () =>
      set({ theatreMode: !get().theatreMode, miniPlayer: false }),
    toggleMiniPlayer: () => get().setMiniPlayer(!get().miniPlayer),
    setMiniPlayer: (status) => {
      const { fullscreen, theatreMode, toggleFullscreen } = get();
      if (status && fullscreen) toggleFullscreen();
      set({ theatreMode: status ? false : theatreMode, miniPlayer: status });
    },
    setMiniPlayerCorner: (corner) => set({ miniPlayerCorner: corner }),
    setVideoPiPActive: (status) =>
      set(
        status
          ? { theatreMode: false, videoPiPActive: true }
          : { videoPiPActive: false },
      ),
    setSharedStatus: (status) => set({ isShared: status }),
    setContainer: (container) => set({ container }),
    setOverlay: (el) => {
      // Mice reveal the controls by moving; a tap only keeps shown ones up.
      el?.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') playerControls.show();
      });
      el?.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'mouse') playerControls.show();
      });
      el?.addEventListener('pointerdown', (event) => {
        if (
          event.pointerType !== 'mouse' &&
          useIFramePlayer.getState().uiShown
        ) {
          playerControls.show();
        }
      });
      el?.addEventListener('pointerleave', (event) => {
        if (event.pointerType === 'mouse') playerControls.scheduleHide();
      });

      set({ overlay: el });
    },
  };
});

const setSpeedOptions = (provider: string) =>
  useIFramePlayer.setState({
    speedOptions:
      provider === 'ashdi'
        ? [1, 1.25, 1.5, 2]
        : useIFramePlayer.getInitialState().speedOptions,
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
