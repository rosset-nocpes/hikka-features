import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useSidebar } from '@/components/ui/sidebar';
import { useIFramePlayer } from '@/hooks/use-iframe-player';
import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/provider_classes';

import { getWatched, usePlayer } from './context/player-context';

interface Props {
  toggleWatchedState: (state: boolean) => void;
  watched: boolean;
}

const getNextEpisode = (
  data: API.WatchData,
  provider: string,
  team: API.TeamData | undefined,
  currentEpisode: API.EpisodeData,
) => {
  const providerData = data[provider];

  if (providerData instanceof ProviderTeamIFrame && team) {
    return providerData.teams[team.title].episodes.find(
      (episode: API.EpisodeData) =>
        episode.episode === currentEpisode.episode + 1,
    );
  }

  if (providerData instanceof ProviderIFrame) {
    return providerData.episodes.find(
      (episode: API.EpisodeData) =>
        episode.episode === currentEpisode.episode + 1,
    );
  }
};

const markCurrentEpisodeWatched = () => {
  (
    document.body.querySelector(
      '.grid > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2) button',
    ) as HTMLButtonElement | null
  )?.click();
};

const getEpisodeKey = (episode: API.EpisodeData) =>
  `${episode.episode}:${episode.video_url}`;

const PlayerIFrameEffects = ({ toggleWatchedState, watched }: Props) => {
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
    if (!isShared) return;

    setOpen(false);
  }, [isShared, setOpen]);

  useEffect(() => {
    if (!currentEpisode) return;

    skipWatchedCheckEpisodeKeyRef.current = getEpisodeKey(currentEpisode);
    toggleWatchedState(false);
    resetIFramePlayer();
  }, [currentEpisode, resetIFramePlayer, toggleWatchedState]);

  useEffect(() => {
    if (!isReady || !isShared) return;

    const time = Number(sharedParams?.time);
    if (Number.isFinite(time) && time > 0) {
      seek(time);
    }

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

    const episodeKey = getEpisodeKey(currentEpisode);
    if (skipWatchedCheckEpisodeKeyRef.current === episodeKey) {
      skipWatchedCheckEpisodeKeyRef.current = undefined;
      return;
    }

    if (!isReady || !duration || watched || currentTime / duration <= 0.88) {
      return;
    }

    if (getWatched() + 1 !== currentEpisode.episode) return;

    markCurrentEpisodeWatched();
    toggleWatchedState(true);
  }, [
    currentEpisode,
    currentTime,
    duration,
    isReady,
    toggleWatchedState,
    watched,
  ]);

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

    const nextEpisode = getNextEpisode(
      watchData,
      provider,
      team,
      currentEpisode,
    );

    if (!nextEpisode) return;

    pendingAutoPlayRef.current = true;
    setEpisode(nextEpisode);

    toast(
      `Зараз ви переглядаєте ${nextEpisode.episode} епізод в озвучці ${team?.title}`,
    );
  }, [currentEpisode, endedCount, provider, setEpisode, team, watchData]);

  return null;
};

export default PlayerIFrameEffects;
