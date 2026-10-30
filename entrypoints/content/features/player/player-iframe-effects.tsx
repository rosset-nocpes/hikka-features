import { useEffect, useRef } from 'react';

import { useSidebar } from '@/components/ui/sidebar';
import { onNextTrack, useIFramePlayer } from '@/hooks/use-iframe-player';
import { watchDataQuery } from '@/hooks/use-watch-data';
import { hikkaTracker } from '@/utils/hikka-tracker';

import { queryClient } from '../../core/query-client';
import {
  followingEpisode,
  onAnimePage,
  progressOf,
  usePlayer,
} from './context/player-context';
import { isPlayerOpen, playNextQueued } from './player';
import { nextEpisode, upNext } from './queue/up-next';
import { useQueue } from './queue/use-queue';
import { useWatchTogether } from './watch-together/use-watch-together';

/** Share of an episode after which it counts as watched on hikka.io. */
const WATCHED_SHARE = 0.88;
/**
 * Share of an episode after which the next one's anime loads, so it starts
 * at once even when it is another anime's.
 */
const PRELOAD_SHARE = 0.8;

const getEpisodeKey = (episode: API.EpisodeData) =>
  `${episode.episode}:${episode.video_url}`;

/** Set while what follows an episode loads, so it plays once ready. */
let pendingAutoPlay = false;

const loadNext = async () => {
  const { room, advance } = useWatchTogether.getState();
  // A watch together room moves everyone on together, to its own queue or
  // the anime's next episode, and plays it.
  if (room) {
    advance();
    return false;
  }

  const before = usePlayer.getState().currentEpisode;
  if (await playNextQueued()) return true;

  const player = usePlayer.getState();
  // While the queue loaded, the user closed the player or picked another.
  if (!isPlayerOpen() || player.currentEpisode !== before) return false;

  const following = followingEpisode(player);
  if (!following) return false;

  player.setEpisode(following);
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
 * it plays and offers what follows once it ends.
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
  const preloadedRef = useRef(false);
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
    preloadedRef.current = false;
    upNext.cancel();
    resetIFramePlayer();
  }, [currentEpisode, resetIFramePlayer]);

  useEffect(() => {
    if (!isReady || !isShared) return;

    const time = Number(sharedParams?.time);
    if (Number.isFinite(time) && time > 0) seek(time);

    play();
    setSharedStatus(false);
  }, [isReady, isShared, play, seek, setSharedStatus, sharedParams]);

  // Once it plays, an episode is no longer up next, and played again from
  // its end, what follows it isn't either. Subscribed, since right after a
  // switch the render's `isPlaying` is still the previous episode's.
  useEffect(
    () =>
      useIFramePlayer.subscribe((state, previous) => {
        if (!state.isPlaying || previous.isPlaying) return;
        upNext.cancel();
        const { slug, currentEpisode } = usePlayer.getState();
        if (
          !slug ||
          !currentEpisode ||
          // The room takes its own queue's episodes off as they play.
          useWatchTogether.getState().room
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

  useEffect(() => {
    onNextTrack(() => {
      upNext.cancel();
      void playNext();
    });
    return () => {
      onNextTrack(undefined);
      upNext.cancel();
      pendingAutoPlay = false;
    };
  }, []);

  // Near the end, loads the anime of what follows, so it starts at once.
  // Read from the store: right after a switch, the render's time is still
  // the previous episode's.
  useEffect(() => {
    const { currentTime, duration } = useIFramePlayer.getState();
    if (
      preloadedRef.current ||
      !duration ||
      currentTime / duration < PRELOAD_SHARE
    ) {
      return;
    }
    preloadedRef.current = true;
    const next = nextEpisode();
    if (next && next.slug !== slug) {
      void queryClient.prefetchQuery(watchDataQuery(next.slug));
    }
  }, [currentTime, duration, slug]);

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

    // A watch together room moves everyone on at once; alone, the user gets
    // a moment to stay.
    if (useWatchTogether.getState().room) void playNext();
    else upNext.offer();
  }, [endedCount]);

  return null;
};

export default PlayerIFrameEffects;
