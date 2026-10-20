import { useEffect, useRef } from 'react';

import { useSidebar } from '@/components/ui/sidebar';
import { useIFramePlayer } from '@/hooks/use-iframe-player';
import { advanceHikkaProgress, getHikkaProgress } from '@/utils/hikka-progress';

import { episodesOf, usePlayer } from './context/player-context';

/** Share of an episode after which it counts as watched on hikka.io. */
const WATCHED_SHARE = 0.88;

const getEpisodeKey = (episode: API.EpisodeData) =>
  `${episode.episode}:${episode.video_url}`;

/**
 * Follows the episode's player: starts shared links where they point, marks
 * the episode watched on hikka.io near its end and plays the next one.
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
  const pendingAutoPlayRef = useRef(false);
  const handledEndCountRef = useRef(0);
  const watchedRef = useRef(false);
  const skipWatchedCheckEpisodeKeyRef = useRef<string | undefined>(undefined);
  const {
    watchData,
    sharedParams,
    isShared,
    setSharedStatus,
    provider,
    team,
    currentEpisode,
    setEpisode,
  } = usePlayer();
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

  useEffect(() => {
    if (!isReady || !pendingAutoPlayRef.current) return;

    pendingAutoPlayRef.current = false;
    play();
  }, [isReady, play]);

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
      getHikkaProgress() + 1 !== currentEpisode.episode
    ) {
      return;
    }

    advanceHikkaProgress();
    watchedRef.current = true;
  }, [currentEpisode, currentTime, duration, isReady]);

  useEffect(() => {
    if (endedCount === 0) {
      handledEndCountRef.current = 0;
      return;
    }

    if (
      handledEndCountRef.current === endedCount ||
      !watchData ||
      !provider ||
      !currentEpisode
    ) {
      return;
    }

    handledEndCountRef.current = endedCount;

    const nextEpisode = episodesOf(
      watchData,
      provider,
      team?.title ?? '',
    )?.find((episode) => episode.episode === currentEpisode.episode + 1);
    if (!nextEpisode) return;

    pendingAutoPlayRef.current = true;
    setEpisode(nextEpisode);
  }, [currentEpisode, endedCount, provider, setEpisode, team, watchData]);

  return null;
};

export default PlayerIFrameEffects;
