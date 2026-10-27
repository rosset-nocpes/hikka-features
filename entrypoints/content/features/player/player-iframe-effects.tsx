import { useEffect, useRef } from 'react';

import { useSidebar } from '@/components/ui/sidebar';
import { useIFramePlayer } from '@/hooks/use-iframe-player';
import { hikkaTracker } from '@/utils/hikka-tracker';

import {
  episodesOf,
  onAnimePage,
  progressOf,
  usePlayer,
} from './context/player-context';
import { isPlayerOpen, playNextQueued } from './player';
import { useQueue } from './queue/use-queue';
import { useWatchTogether } from './watch-together/use-watch-together';

/** Share of an episode after which it counts as watched on hikka.io. */
const WATCHED_SHARE = 0.88;

const getEpisodeKey = (episode: API.EpisodeData) =>
  `${episode.episode}:${episode.video_url}`;

/** Set while what follows an episode loads, so it plays once ready. */
let pendingAutoPlay = false;

const loadNext = async () => {
  const before = usePlayer.getState().currentEpisode;
  // Another anime would leave the watch together room.
  if (!useWatchTogether.getState().room && (await playNextQueued())) {
    return true;
  }

  const { watchData, provider, team, currentEpisode, setEpisode } =
    usePlayer.getState();
  // While the queue loaded, the user closed the player or picked another.
  if (!isPlayerOpen() || currentEpisode !== before) return false;

  const nextEpisode =
    watchData &&
    provider &&
    currentEpisode &&
    episodesOf(watchData, provider, team?.title ?? '')?.find(
      (episode) => episode.episode === currentEpisode.episode + 1,
    );
  if (!nextEpisode) return false;

  setEpisode(nextEpisode);
  return true;
};

/** Plays what follows the episode: the queue, else the anime's next one. */
export const playNext = async () => {
  pendingAutoPlay = true;
  const played = await loadNext();
  if (!played) pendingAutoPlay = false;
  return played;
};

/**
 * Follows the episode's player: starts shared links where they point, marks
 * the episode watched on hikka.io near its end, takes it off the queue once
 * it plays and plays what follows.
 */
const PlayerIFrameEffects = () => {
  const {
    isReady,
    currentTime,
    duration,
    endedCount,
    play,
    seek,
    reset: resetIFramePlayer,
  } = useIFramePlayer();
  const handledEndCountRef = useRef(0);
  const watchedRef = useRef(false);
  const skipWatchedCheckEpisodeKeyRef = useRef<string | undefined>(undefined);
  const { slug, sharedParams, isShared, setSharedStatus, currentEpisode } =
    usePlayer();
  const { setOpen } = useSidebar();

  useEffect(() => {
    if (isShared) setOpen(false);
  }, [isShared, setOpen]);

  useEffect(() => {
    if (!currentEpisode) return;

    skipWatchedCheckEpisodeKeyRef.current = getEpisodeKey(currentEpisode);
    watchedRef.current = false;
    resetIFramePlayer();
  }, [currentEpisode, resetIFramePlayer]);

  useEffect(() => {
    if (!isReady || !isShared) return;

    const time = Number(sharedParams?.time);
    if (Number.isFinite(time) && time > 0) seek(time);

    play();
    setSharedStatus(false);
  }, [isReady, isShared, play, seek, setSharedStatus, sharedParams]);

  // Once it plays, an episode is no longer up next. Subscribed, since right
  // after a switch the render's `isPlaying` is still the previous episode's.
  useEffect(
    () =>
      useIFramePlayer.subscribe((state, previous) => {
        const { slug, currentEpisode } = usePlayer.getState();
        if (
          !state.isPlaying ||
          previous.isPlaying ||
          !slug ||
          !currentEpisode
        ) {
          return;
        }
        useQueue.getState().remove({ slug, episode: currentEpisode.episode });
      }),
    [],
  );

  useEffect(() => {
    if (!isReady || !pendingAutoPlay) return;

    pendingAutoPlay = false;
    play();
  }, [isReady, play]);

  useEffect(
    () => () => {
      pendingAutoPlay = false;
    },
    [],
  );

  useEffect(() => {
    if (!currentEpisode) return;

    // Right after a switch, the time is still the previous episode's.
    if (
      skipWatchedCheckEpisodeKeyRef.current === getEpisodeKey(currentEpisode)
    ) {
      skipWatchedCheckEpisodeKeyRef.current = undefined;
      return;
    }

    if (
      !isReady ||
      !duration ||
      watchedRef.current ||
      currentTime / duration <= WATCHED_SHARE ||
      // The page's tracker is another anime's.
      !onAnimePage(slug) ||
      progressOf(slug) + 1 !== currentEpisode.episode
    ) {
      return;
    }

    hikkaTracker.advance();
    watchedRef.current = true;
  }, [currentEpisode, currentTime, duration, isReady, slug]);

  useEffect(() => {
    if (endedCount === 0) {
      handledEndCountRef.current = 0;
      return;
    }

    if (handledEndCountRef.current === endedCount) return;
    handledEndCountRef.current = endedCount;

    void playNext();
  }, [endedCount]);

  return null;
};

export default PlayerIFrameEffects;
