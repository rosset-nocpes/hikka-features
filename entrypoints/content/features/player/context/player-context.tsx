import { create } from 'zustand';

import { playerControls } from '@/hooks/use-iframe-player';
import { account } from '@/utils/account';
import { ProviderTeamIFrame } from '@/utils/providers';

import type { QueueItem } from '../queue/use-queue';
import type { SharedPlayerParams } from './link-params';

import { takeLinkParams } from './link-params';
import {
  episodesOf,
  favoriteIn,
  nextUnwatched,
  preferredSource,
  priorityTeam,
  queuedSource,
  sharedSource,
  teamOf,
  watchDataKey,
} from './sources';

interface PlayerState {
  container?: HTMLElement;
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
  /** The share link's, until it has started playing. */
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

/**
 * The episode after the playing one from the same source, which plays once
 * the queue runs out.
 */
export const followingEpisode = ({
  watchData,
  provider,
  team,
  currentEpisode,
}: Pick<PlayerState, 'watchData' | 'provider' | 'team' | 'currentEpisode'>) =>
  watchData && provider && currentEpisode
    ? episodesOf(watchData, provider, team?.title ?? '')?.find(
        (episode) => episode.episode === currentEpisode.episode + 1,
      )
    : undefined;

/** The mini player or the bar shown during picture-in-picture. */
export const compactMode = ({
  miniPlayer,
  videoPiPActive,
}: Pick<PlayerState, 'miniPlayer' | 'videoPiPActive'>) =>
  miniPlayer || videoPiPActive;

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
      const key = watchDataKey(data);
      const { favoriteTeam } = favoriteIn(data, slug);

      if (target) {
        const selection = queuedSource(data, target);
        if (!selection) return false;
        if (selection.provider !== get().provider) {
          setSpeedOptions(selection.provider);
        }
        set({
          watchData: data,
          watchDataKey: key,
          slug,
          favoriteTeam,
          ...selection,
          isShared: false,
        });
        return true;
      }

      if (get().slug === slug && get().watchDataKey === key) {
        return true;
      }

      const { sharedParams, isShared, roomInvite, roomInviteAccepted } =
        takeLinkParams();
      // A shared link wins over the user's preferences.
      const { provider, team } = isShared
        ? sharedSource(data, slug, sharedParams.provider!, sharedParams.team!)
        : preferredSource(data, slug);

      const episodeData = episodesOf(data, provider, team.title)!;
      const sharedEpisode = isShared
        ? episodeData.find((ep) => ep.episode === Number(sharedParams.episode))
        : undefined;

      setSpeedOptions(provider);
      set({
        watchData: data,
        watchDataKey: key,
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

interface FavoriteTeam {
  provider: string;
  team: string;
}

export type MiniPlayerCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';
