import { create } from 'zustand';

import { playerControls } from '@/hooks/use-iframe-player';
import { account } from '@/utils/account';
import { hikkaTracker } from '@/utils/hikka-tracker';
import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/provider_classes';

import type { QueueItem } from '../queue/use-queue';

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
  /**
   * Loads `slug`'s watch data at `target`, its source falling back to any
   * other with the episode; false when none has it. Without a target, a
   * share link or the user's preferences pick what to show.
   */
  initialize: (
    data: API.WatchData,
    slug: string,
    target?: QueueItem,
  ) => boolean;
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

/** Whether the page is `slug`'s, whose tracker the player may read and use. */
export const onAnimePage = (slug?: string) => {
  const page = usePageStore.getState();
  return !!slug && page.contentType === 'anime' && page.slug === slug;
};

/** Episodes of `slug` the user watched, known on its own page only. */
export const progressOf = (slug?: string) =>
  onAnimePage(slug) ? hikkaTracker.progress : 0;

/** The episode after the user's progress on hikka.io, else the first. */
const nextUnwatched = (episodes: API.EpisodeData[], slug?: string) =>
  episodes.find((episode) => episode.episode === progressOf(slug) + 1) ??
  episodes[0];

/** The team the user's priority picks on `provider`, else its first one. */
const priorityTeam = (data: API.WatchData, provider: string, slug?: string) => {
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
      progressOf(slug) + 1,
    )?.team ?? source.getTeams()[0]!
  );
};

/** `slug`'s favourite team, if its provider still lists it. */
const favoriteIn = (data: API.WatchData, slug: string) => {
  const stored = useSettings.getState().features.player.favoriteTeams[slug];
  const source = stored && data[stored.provider];
  const team =
    source instanceof ProviderTeamIFrame
      ? source
          .getTeams()
          .find(
            (candidate) =>
              candidate.title === stored!.team ||
              candidate.canonicalTitle === stored!.team,
          )
      : undefined;
  return {
    team: team && { provider: stored!.provider, team },
    favoriteTeam: team
      ? { provider: stored!.provider, team: team.title }
      : stored,
  };
};

/**
 * The source the player opens `slug` with: this anime's favourite team, then
 * the team priority list, then the default provider's first team.
 */
export const preferredSource = (data: API.WatchData, slug: string) => {
  const { defaultProvider, teamPriority, teamPriorityTranslation } =
    useSettings.getState().features.player;
  const available = providersOf(data).map(({ title }) => title);
  const providerOrder = available.includes(defaultProvider)
    ? [defaultProvider, ...available.filter((name) => name !== defaultProvider)]
    : available;

  const pick =
    favoriteIn(data, slug).team ??
    pickPriorityTeam(
      data,
      providerOrder,
      teamPriority,
      teamPriorityTranslation,
      progressOf(slug) + 1,
    );
  if (pick) return pick;

  const provider = providerOrder[0]!;
  const source = data[provider];
  return {
    provider,
    team:
      source instanceof ProviderTeamIFrame ? source.getTeams()[0]! : NO_TEAM,
  };
};

/**
 * Where a queued episode plays: the source it was queued from, else the team
 * priority's pick, else any source that has it.
 */
const queuedSource = (data: API.WatchData, target: QueueItem) => {
  const { teamPriority, teamPriorityTranslation } =
    useSettings.getState().features.player;
  const providers = providersOf(data).map(({ title }) => title);
  const pick = pickPriorityTeam(
    data,
    providers,
    teamPriority,
    teamPriorityTranslation,
    target.episode,
  );
  const candidates = [
    target,
    ...(pick ? [{ provider: pick.provider, team: pick.team.title }] : []),
    ...providers.flatMap((provider) => {
      const source = data[provider];
      return source instanceof ProviderTeamIFrame
        ? Object.keys(source.teams).map((team) => ({ provider, team }))
        : [{ provider, team: '' }];
    }),
  ];

  for (const { provider, team } of candidates) {
    const episodeData = episodesOf(data, provider, team);
    const currentEpisode = episodeData?.find(
      (episode) => episode.episode === target.episode,
    );
    if (currentEpisode) {
      return {
        provider,
        team: teamOf(data, provider, team),
        episodeData: episodeData!,
        currentEpisode,
      };
    }
  }
  return undefined;
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

    initialize: (data, slug, target) => {
      const watchDataKey = getWatchDataKey(data);
      const { favoriteTeam } = favoriteIn(data, slug);

      if (target) {
        const selection = queuedSource(data, target);
        if (!selection) return false;
        if (selection.provider !== get().provider) {
          setSpeedOptions(selection.provider);
        }
        set({
          watchData: data,
          watchDataKey,
          slug,
          favoriteTeam,
          ...selection,
          isShared: false,
        });
        return true;
      }

      if (get().slug === slug && get().watchDataKey === watchDataKey) {
        return true;
      }

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

      // A shared link wins over the user's preferences.
      const preferred = preferredSource(data, slug);
      const sharedSource =
        isShared &&
        providersOf(data).some(({ title }) => title === sharedParams.provider)
          ? data[sharedParams.provider!]
          : undefined;

      let { provider, team } = preferred;
      if (sharedSource) {
        provider = sharedParams.provider!;
        team = !(sharedSource instanceof ProviderTeamIFrame)
          ? NO_TEAM
          : sharedSource.teams[sharedParams.team!]
            ? sharedSource.getTeam(sharedParams.team!)
            : preferred.provider === provider
              ? preferred.team
              : sharedSource.getTeams()[0]!;
      }

      const episodeData = episodesOf(data, provider, team.title)!;
      const sharedEpisode = isShared
        ? episodeData.find((ep) => ep.episode === Number(sharedParams.episode))
        : undefined;

      setSpeedOptions(provider);
      set({
        watchData: data,
        watchDataKey,
        slug,
        provider,
        team,
        favoriteTeam,
        episodeData,
        currentEpisode: sharedEpisode ?? nextUnwatched(episodeData, slug),
        sharedParams,
        isShared,
        roomInvite,
        roomInviteAccepted,
      });
      return true;
    },
    setProvider: (provider) => {
      const { watchData } = get();
      if (!watchData) return;

      const { slug } = get();
      const team = priorityTeam(watchData, provider, slug);
      const episodeData = episodesOf(watchData, provider, team.title)!;
      setSpeedOptions(provider);
      set({
        provider,
        team,
        episodeData,
        currentEpisode: nextUnwatched(episodeData, slug),
      });
    },
    setTeam: (team) => {
      const { watchData, provider, slug } = get();
      if (!watchData || !(watchData[provider!] instanceof ProviderTeamIFrame)) {
        return;
      }

      const episodeData = episodesOf(watchData, provider!, team.title)!;
      set({
        team,
        episodeData,
        currentEpisode: nextUnwatched(episodeData, slug),
      });
    },
    toggleFavoriteTeam: (team) => {
      const { slug, provider, watchData } = get();
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
