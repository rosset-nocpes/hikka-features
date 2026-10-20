import type { FC, ReactNode } from 'react';

import MaterialSymbolsFitScreenOutlineRounded from '~icons/material-symbols/fit-screen-outline-rounded';
import MaterialSymbolsFullscreenExitRounded from '~icons/material-symbols/fullscreen-exit-rounded';
import MaterialSymbolsFullscreenRounded from '~icons/material-symbols/fullscreen-rounded';
import MaterialSymbolsPauseOutlineRounded from '~icons/material-symbols/pause-outline-rounded';
import MaterialSymbolsPictureInPictureAltRounded from '~icons/material-symbols/picture-in-picture-alt-rounded';
import MaterialSymbolsPlayArrowOutlineRounded from '~icons/material-symbols/play-arrow-outline-rounded';
import MaterialSymbolsVolumeDownOutlineRounded from '~icons/material-symbols/volume-down-outline-rounded';
import MaterialSymbolsVolumeOffOutlineRounded from '~icons/material-symbols/volume-off-outline-rounded';
import MaterialSymbolsVolumeUpOutlineRounded from '~icons/material-symbols/volume-up-outline-rounded';
import MaterialSymbolsWidthFullOutline from '~icons/material-symbols/width-full-outline';

import { Button } from '@/components/ui/button';
import { sendIFramePlayerCommand } from '@/integrations/iframe-player/protocol';

import { usePlayer } from '../../context/player-context';
import ToolbarTooltip from '../toolbar-tooltip';

interface Props {
  label: string;
  onClick: () => void;
  children: ReactNode;
}

/** An icon button of the player's toolbar, named by its tooltip. */
const ToolbarButton: FC<Props> = ({ label, onClick, children }) => (
  <ToolbarTooltip label={label}>
    <Button variant="ghost" size="icon-sm" onClick={onClick}>
      {children}
    </Button>
  </ToolbarTooltip>
);

export const Play = () => {
  const { isPlaying, play, pause } = useIFramePlayer();

  return (
    <ToolbarButton
      label={isPlaying ? 'Призупинити' : 'Відтворити'}
      onClick={isPlaying ? pause : play}
    >
      {isPlaying ? (
        <MaterialSymbolsPauseOutlineRounded className="size-5" />
      ) : (
        <MaterialSymbolsPlayArrowOutlineRounded className="size-5" />
      )}
    </ToolbarButton>
  );
};

export const Mute = () => {
  const { isMuted, toggleMute, volume } = useIFramePlayer();
  const silent = isMuted || volume === 0;

  return (
    <ToolbarButton
      label={silent ? 'Увімкнути звук' : 'Вимкнути звук'}
      onClick={toggleMute}
    >
      {silent ? (
        <MaterialSymbolsVolumeOffOutlineRounded className="size-5" />
      ) : volume < 0.5 ? (
        <MaterialSymbolsVolumeDownOutlineRounded className="size-5" />
      ) : (
        <MaterialSymbolsVolumeUpOutlineRounded className="size-5" />
      )}
    </ToolbarButton>
  );
};

export const Fullscreen = () => {
  const { fullscreen, toggleFullscreen } = usePlayer();

  return (
    <ToolbarButton
      label={
        fullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'
      }
      onClick={toggleFullscreen}
    >
      {fullscreen ? (
        <MaterialSymbolsFullscreenExitRounded />
      ) : (
        <MaterialSymbolsFullscreenRounded />
      )}
    </ToolbarButton>
  );
};

export const TheatreMode = () => {
  const { theatreMode, toggleTheatreMode } = usePlayer();

  return (
    <ToolbarButton
      label={theatreMode ? 'Вийти з режиму театру' : 'Режим театру'}
      onClick={toggleTheatreMode}
    >
      {theatreMode ? (
        <MaterialSymbolsFitScreenOutlineRounded />
      ) : (
        <MaterialSymbolsWidthFullOutline />
      )}
    </ToolbarButton>
  );
};

/** The custom mini player, or the browser's picture-in-picture. */
export const MiniPlayer = () => {
  const { miniPlayer, videoPiPActive, toggleMiniPlayer } = usePlayer();
  const { miniModeType } = useSettings().features.player;
  const isVideoNative = miniModeType === 'video-native';
  const isActive = isVideoNative ? videoPiPActive : miniPlayer;

  return (
    <ToolbarButton
      label={isActive ? 'Вийти з мінірежиму' : 'Мінірежим'}
      onClick={() =>
        isVideoNative
          ? sendIFramePlayerCommand({ action: 'toggle-picture-in-picture' })
          : toggleMiniPlayer()
      }
    >
      {isActive ? (
        <MaterialSymbolsFitScreenOutlineRounded />
      ) : (
        <MaterialSymbolsPictureInPictureAltRounded />
      )}
    </ToolbarButton>
  );
};
