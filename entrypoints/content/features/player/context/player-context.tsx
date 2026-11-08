import { create } from 'zustand';

import type { FavoriteTeam } from '@/hooks/use-settings';

import { playerControls } from '@/hooks/use-iframe-player';
import { account } from '@/utils/account';
import { favoriteTeamOf } from '@/utils/favorite-team';

import type { QueueItem } from '../queue/use-queue';
import type { MergedTeam } from '../teams';
import type { SharedPlayerParams } from './link-params';

import { takeLinkParams } from './link-params';
import {
  exactSource,
  favoriteOf,
  nextUnwatched,
  preferredTeam,
  queuedSource,
  type Selection,
  sharedSource,
  teamsOf,
  watchDataKey,
} from './sources';

interface PlayerState {
  container?: HTMLElement;
  watchData?: API.WatchData; // todo: remove it from there
  watchDataKey?: string;
  slug?: string;
  /** The anime's teams, each once whichever providers list it. */
  teams?: MergedTeam[];
  /**
   * The provider the user picked to play this anime from wherever it has
   * the episode; without one, each episode plays from the first provider
   * that has it (see providerOrder).
   */
  pinnedProvider?: string;
  /** Where the episode picks up once its new source loads. */
  resumeAt?: { time: number; playing: boolean };
  team?: MergedTeam;
  /** The playing episode's provider. */
  provider?: string;
  /** `key` of the anime's favourite team. */
  favoriteKey?: string;
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
  /** Plays from `provider` wherever it can, or from any without one. */
  setPinnedProvider: (provider?: string) => void;
  setTeam: (team: MergedTeam) => void;
  /** Makes the team this anime's favourite, or stops it being one. */
  toggleFavoriteTeam: (team: MergedTeam) => void;
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
 * The team's episode after the playing one, from whichever provider has it,
 * which plays once the queue runs out.
 */
export const followingEpisode = ({
  team,
  currentEpisode,
}: Pick<PlayerState, 'team' | 'currentEpisode'>) =>
  currentEpisode
    ? team?.episodes.find(
        ({ episode }) => episode === currentEpisode.episode + 1,
      )
    : undefined;

/** The mini player or the bar shown during picture-in-picture. */
export const compactMode = ({
  miniPlayer,
  videoPiPActive,
}: Pick<PlayerState, 'miniPlayer' | 'videoPiPActive'>) =>
  miniPlayer || videoPiPActive;

export const isFavoriteTeam = (
  { favoriteKey }: Pick<PlayerState, 'favoriteKey'>,
  team: MergedTeam,
) => favoriteKey === team.key;

export const usePlayer = create<PlayerState & PlayerActions>((set, get) => {
  const handleFullscreenChange = () => {
    if (document.fullscreenElement) return;
    set({ fullscreen: false });
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  };

  const setFavoriteTeam = (slug: string, favorite?: FavoriteTeam) => {
    const { favoriteTeams } = useSettings.getState().features.player;
    const { [slug]: _previous, ...others } = favoriteTeams;
    useSettings.getState().updateFeatureSettings('player', {
      favoriteTeams: favorite ? { ...others, [slug]: favorite } : others,
    });
  };

  /** The state that shows `entry` of `team`. */
  const show = ({ team, entry }: Selection) => {
    if (entry.provider !== get().provider) setSpeedOptions(entry.provider);
    return {
      team,
      provider: entry.provider,
      currentEpisode: entry,
      resumeAt: undefined,
    };
  };

  /**
   * Follows a favourite whose team changed key, as when it joins the
   * catalogue, so the account matches its releases by catalogue id.
   */
  const refreshFavorite = (slug: string, found?: MergedTeam) => {
    const favorite = useSettings.getState().features.player.favoriteTeams[slug];
    if (!favorite || !found || favorite.key === found.key) return;
    setFavoriteTeam(slug, favoriteTeamOf(found));
    account
      .saveFavorite({
        animeSlug: slug,
        teamId: found.id,
        teamTitle: found.title,
        translationType: found.translationType,
      })
      .catch(console.error);
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
      // A pick works around one anime's source, not the next one's.
      const pinnedProvider =
        get().slug === slug ? get().pinnedProvider : undefined;
      const teams = teamsOf(data, pinnedProvider);
      const favorite = favoriteOf(teams, slug);
      refreshFavorite(slug, favorite);
      const loaded = {
        watchData: data,
        watchDataKey: key,
        slug,
        teams,
        pinnedProvider,
        favoriteKey: favorite?.key,
      };

      if (target) {
        const selection = queuedSource(teams, target);
        if (!selection) return false;
        set({ ...loaded, ...show(selection), isShared: false });
        return true;
      }

      if (get().slug === slug && get().watchDataKey === key) {
        return true;
      }

      const { sharedParams, isShared, roomInvite, roomInviteAccepted } =
        takeLinkParams();
      // A shared link wins over the user's preferences.
      let selection: Selection;
      if (isShared) {
        selection = sharedSource(teams, slug, sharedParams);
      } else {
        const team = preferredTeam(teams, slug);
        selection = { team, entry: nextUnwatched(team.episodes, slug) };
      }

      set({
        ...loaded,
        ...show(selection),
        sharedParams,
        isShared,
        roomInvite,
        roomInviteAccepted,
      });
      return true;
    },
    setPinnedProvider: (pinnedProvider) => {
      const { watchData, slug, team, currentEpisode } = get();
      if (!watchData) {
        set({ pinnedProvider });
        return;
      }

      const teams = teamsOf(watchData, pinnedProvider);
      const shown = teams.find(({ key }) => key === team?.key) ?? teams[0]!;
      const sameEpisode = shown.episodes.find(
        ({ episode }) => episode === currentEpisode?.episode,
      );
      const entry = sameEpisode ?? nextUnwatched(shown.episodes, slug);
      if (entry === currentEpisode) {
        set({ pinnedProvider, teams, team: shown });
        return;
      }

      // The same episode from elsewhere carries on where it was.
      const { currentTime, isPlaying } = useIFramePlayer.getState();
      set({
        pinnedProvider,
        teams,
        ...show({ team: shown, entry }),
        resumeAt:
          sameEpisode && shown.key === team?.key && currentTime > 0
            ? { time: currentTime, playing: isPlaying }
            : undefined,
      });
    },
    setTeam: (team) =>
      set(show({ team, entry: nextUnwatched(team.episodes, get().slug) })),
    toggleFavoriteTeam: (team) => {
      const { slug } = get();
      if (!slug) return;

      if (isFavoriteTeam(get(), team)) {
        setFavoriteTeam(slug);
        set({ favoriteKey: undefined });
        account.removeFavorite(slug).catch(console.error);
        return;
      }

      setFavoriteTeam(slug, favoriteTeamOf(team));
      set({ favoriteKey: team.key });
      account
        .saveFavorite({
          animeSlug: slug,
          teamId: team.id,
          teamTitle: team.title,
          translationType: team.translationType,
        })
        .catch(console.error);
    },
    setEpisode: (entry) => set(show({ team: get().team!, entry })),
    selectSource: (provider, team, episode) => {
      const { teams } = get();
      const selection = teams && exactSource(teams, provider, team, episode);
      if (!selection) return false;
      set(show(selection));
      return true;
    },
    dismissRoomInvite: () =>
      set({ roomInvite: undefined, roomInviteAccepted: undefined }),
    toggleFullscreen: () => {
      if (get().fullscreen) {
        set({ fullscreen: false });
        document.exitFullscreen();
        document.removeEventListener(
          'fullscreenchange',
          handleFullscreenChange,
        );
      } else {
        set({ fullscreen: true, miniPlayer: false });
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

export type MiniPlayerCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';
