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

import SwapIcon from '@/components/swap-icon';
import { Button } from '@/components/ui/button';
import { sendIFramePlayerCommand } from '@/integrations/iframe-player/protocol';

import { usePlayer } from '../../context/player-context';
import ToolbarTooltip from '../toolbar-tooltip';

interface Props {
  label: string;
  /** Its keyboard shortcut, shown in the tooltip. */
  shortcut?: string;
  onClick: () => void;
  children: ReactNode;
}

/** An icon button of the player's toolbar, named by its tooltip. */
const ToolbarButton: FC<Props> = ({ label, shortcut, onClick, children }) => (
  <ToolbarTooltip label={label} shortcut={shortcut}>
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
      shortcut="K"
      onClick={isPlaying ? pause : play}
    >
      <SwapIcon
        active={isPlaying}
        on={<MaterialSymbolsPauseOutlineRounded className="size-5" />}
        off={<MaterialSymbolsPlayArrowOutlineRounded className="size-5" />}
      />
    </ToolbarButton>
  );
};

export const Mute = () => {
  const { isMuted, toggleMute, volume } = useIFramePlayer();
  const silent = isMuted || volume === 0;

  return (
    <ToolbarButton
      label={silent ? 'Увімкнути звук' : 'Вимкнути звук'}
      shortcut="M"
      onClick={toggleMute}
    >
      {/* Only muting crossfades; the level icons swap as the slider moves. */}
      <SwapIcon
        active={silent}
        on={<MaterialSymbolsVolumeOffOutlineRounded className="size-5" />}
        off={
          volume < 0.5 ? (
            <MaterialSymbolsVolumeDownOutlineRounded className="size-5" />
          ) : (
            <MaterialSymbolsVolumeUpOutlineRounded className="size-5" />
          )
        }
      />
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
      shortcut="F"
      onClick={toggleFullscreen}
    >
      <SwapIcon
        active={fullscreen}
        on={<MaterialSymbolsFullscreenExitRounded />}
        off={<MaterialSymbolsFullscreenRounded />}
      />
    </ToolbarButton>
  );
};

export const TheatreMode = () => {
  const { theatreMode, toggleTheatreMode } = usePlayer();

  return (
    <ToolbarButton
      label={theatreMode ? 'Вийти з режиму театру' : 'Режим театру'}
      shortcut="T"
      onClick={toggleTheatreMode}
    >
      <SwapIcon
        active={theatreMode}
        on={<MaterialSymbolsFitScreenOutlineRounded />}
        off={<MaterialSymbolsWidthFullOutline />}
      />
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
      <SwapIcon
        active={isActive}
        on={<MaterialSymbolsFitScreenOutlineRounded />}
        off={<MaterialSymbolsPictureInPictureAltRounded />}
      />
    </ToolbarButton>
  );
};
