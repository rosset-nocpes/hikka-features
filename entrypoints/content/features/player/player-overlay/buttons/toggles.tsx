import MaterialSymbolsFitScreenOutlineRounded from '~icons/material-symbols/fit-screen-outline-rounded';
import MaterialSymbolsFullscreenExitRounded from '~icons/material-symbols/fullscreen-exit-rounded';
import MaterialSymbolsFullscreenRounded from '~icons/material-symbols/fullscreen-rounded';
import MaterialSymbolsPictureInPictureAltRounded from '~icons/material-symbols/picture-in-picture-alt-rounded';
import MaterialSymbolsWidthFullOutline from '~icons/material-symbols/width-full-outline';

import {
  MediaButton,
  PlayPauseIcon,
  TimeToggle,
  VolumeIcon,
} from '@/components/media/controls';
import SwapIcon from '@/components/swap-icon';
import { sendIFramePlayerCommand } from '@/integrations/iframe-player/protocol';

import { usePlayer } from '../../context/player-context';

export const Play = () => {
  const { isPlaying, play, pause } = useIFramePlayer();

  return (
    <MediaButton
      label={isPlaying ? 'Призупинити' : 'Відтворити'}
      shortcut="K"
      onClick={isPlaying ? pause : play}
    >
      <PlayPauseIcon playing={isPlaying} />
    </MediaButton>
  );
};

export const Mute = () => {
  const { isMuted, toggleMute, volume } = useIFramePlayer();
  const silent = isMuted || volume === 0;

  return (
    <MediaButton
      label={silent ? 'Увімкнути звук' : 'Вимкнути звук'}
      shortcut="M"
      onClick={toggleMute}
    >
      <VolumeIcon silent={silent} volume={volume} />
    </MediaButton>
  );
};

/** The video's time and length. */
export const TimeGroup = () => {
  const { currentTime, duration } = useIFramePlayer();
  return <TimeToggle currentTime={currentTime} duration={duration} />;
};

export const Fullscreen = () => {
  const { fullscreen, toggleFullscreen } = usePlayer();

  return (
    <MediaButton
      label={
        fullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'
      }
      shortcut="F"
      onClick={toggleFullscreen}
    >
      <SwapIcon
        active={fullscreen}
        on={<MaterialSymbolsFullscreenExitRounded />}
        off={<MaterialSymbolsFullscreenRounded />}
      />
    </MediaButton>
  );
};

export const TheatreMode = () => {
  const { theatreMode, toggleTheatreMode } = usePlayer();

  return (
    <MediaButton
      label={theatreMode ? 'Вийти з режиму театру' : 'Режим театру'}
      shortcut="T"
      onClick={toggleTheatreMode}
    >
      <SwapIcon
        active={theatreMode}
        on={<MaterialSymbolsFitScreenOutlineRounded />}
        off={<MaterialSymbolsWidthFullOutline />}
      />
    </MediaButton>
  );
};

/** The custom mini player, or the browser's picture-in-picture. */
export const MiniPlayer = () => {
  const { miniPlayer, videoPiPActive, toggleMiniPlayer } = usePlayer();
  const { miniModeType } = useSettings().features.player;
  const isVideoNative = miniModeType === 'video-native';
  const isActive = isVideoNative ? videoPiPActive : miniPlayer;

  return (
    <MediaButton
      label={isActive ? 'Вийти з мінірежиму' : 'Мінірежим'}
      onClick={() =>
        isVideoNative
          ? sendIFramePlayerCommand({ action: 'toggle-picture-in-picture' })
          : toggleMiniPlayer()
      }
    >
      <SwapIcon
        active={isActive}
        on={<MaterialSymbolsFitScreenOutlineRounded />}
        off={<MaterialSymbolsPictureInPictureAltRounded />}
      />
    </MediaButton>
  );
};
