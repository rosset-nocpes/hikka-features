import {
  isHLSProvider,
  MediaPlayer,
  type MediaPlayerInstance,
  MediaProvider,
  type MediaProviderAdapter,
  type MediaProviderChangeEvent,
  useMediaRemote,
} from '@vidstack/react';
// import '@vidstack/react/player/styles/default/layouts/video.css';
// import '@vidstack/react/player/styles/default/theme.css';
// import './vidstack-layout.css';
import HLS from 'hls.js';
import type { FC, Ref } from 'react';
import { VideoLayout } from '@/components/vidstack-layout/vidstack-layout';
import { usePlayer } from './context/player-context';

interface Props {
  // data: API.WatchData;
  ref?: Ref<MediaPlayerInstance>;
}

const VidStackPlayer: FC<Props> = ({ ref }) => {
  const { provider, team, currentEpisode, setEpisode } = usePlayer();
  const { data: watchData } = useWatchData();

  // todo
  // const { data: hlsData } = usePlayerjsData();
  const hlsData = {
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  };

  const { data: animeData } = useHikkaAnime();

  const remote = useMediaRemote();

  const onProviderChange = (
    provider: MediaProviderAdapter | null,
    nativeEvent: MediaProviderChangeEvent,
  ) => {
    if (isHLSProvider(provider)) {
      // Static import
      provider.library = HLS;
      // Or, dynamic import
      provider.library = () => import('hls.js');
    }
  };

  const onEnded = () => {
    if (!watchData || !provider || !team || !currentEpisode) return;

    const providerData = watchData[provider];
    let nextEpisode: API.EpisodeData | undefined;

    if (providerData instanceof ProviderTeamIFrame) {
      const teamEpisodes = providerData.teams[team.title].episodes;
      nextEpisode = teamEpisodes.find(
        (episode: API.EpisodeData) =>
          episode.episode === currentEpisode.episode + 1,
      );
    } else if (providerData instanceof ProviderIFrame) {
      nextEpisode = providerData.episodes.find(
        (episode: API.EpisodeData) =>
          episode.episode === currentEpisode.episode + 1,
      );
    }

    if (nextEpisode) {
      setEpisode(nextEpisode);

      remote.play();
    }
  };

  const title =
    animeData?.title_ua || animeData?.title_en || animeData?.title_ja;

  return (
    <MediaPlayer
      src={hlsData?.hlsUrl}
      title={`Епізод #${currentEpisode?.episode}`}
      artist={title}
      artwork={[{ src: animeData?.image }]}
      ref={ref}
      onProviderChange={onProviderChange}
      className="w-full outline-none"
      onEnded={onEnded}
    >
      <MediaProvider className="flex size-full justify-center" />
      <VideoLayout thumbnails={hlsData?.vttUrl} />
    </MediaPlayer>
  );
};

export default VidStackPlayer;
