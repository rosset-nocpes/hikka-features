import {
  isHLSProvider,
  MediaPlayer,
  MediaPlayerInstance,
  MediaProvider,
  MediaProviderAdapter,
  MediaProviderChangeEvent,
  useMediaRemote,
} from '@vidstack/react';
// import '@vidstack/react/player/styles/default/layouts/video.css';
// import '@vidstack/react/player/styles/default/theme.css';
// import './vidstack-layout.css';
import HLS from 'hls.js';
import { FC, Ref } from 'react';
import { VideoLayout } from '@/components/vidstack-layout/vidstack-layout';
import { usePlayerContext } from './context/player-context';

interface Props {
  url: string;
  title: string;
  data: API.WatchData;
  ref?: Ref<MediaPlayerInstance>;
}

const VidStackPlayer: FC<Props> = ({ url, title, data, ref }) => {
  const playerContext = usePlayerContext();

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
    const nextEpisode = data![playerContext.state.provider][
      playerContext.state.team
    ].find(
      (episode: API.EpisodeData) =>
        episode.episode === playerContext.state.currentEpisode.episode + 1,
    );

    if (nextEpisode) {
      playerContext.setState((prev) => ({
        ...prev,
        currentEpisode: nextEpisode,
      }));

      remote.play();
    }
  };

  return (
    <MediaPlayer
      ref={ref}
      title={title}
      src={url}
      onProviderChange={onProviderChange}
      onEnded={onEnded}
    >
      <MediaProvider />
      <VideoLayout />
    </MediaPlayer>
  );
};

export default VidStackPlayer;
