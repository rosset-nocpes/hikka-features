import MaterialSymbolsFitScreenOutlineRounded from '~icons/material-symbols/fit-screen-outline-rounded';
import MaterialSymbolsPictureInPictureAltRounded from '~icons/material-symbols/picture-in-picture-alt-rounded';

import { Button } from '@/components/ui/button';
import { sendIFramePlayerCommand } from '@/integrations/iframe-player/protocol';

import { usePlayer } from '../../context/player-context';
import ToolbarTooltip from '../toolbar-tooltip';

const MiniPlayer = () => {
  const { miniPlayer, videoPiPActive, toggleMiniPlayer } = usePlayer();
  const { miniModeType } = useSettings().features.player;

  const isVideoNative = miniModeType === 'video-native';
  const isActive = isVideoNative ? videoPiPActive : miniPlayer;

  const handleClick = () => {
    if (isVideoNative) {
      sendIFramePlayerCommand({ action: 'toggle-picture-in-picture' });
    } else {
      toggleMiniPlayer();
    }
  };

  const tooltipText = isActive ? 'Вийти з мінірежиму' : 'Мінірежим';

  return (
    <ToolbarTooltip label={tooltipText}>
      <Button variant="ghost" size="icon-sm" onClick={handleClick}>
        {isActive ? (
          <MaterialSymbolsFitScreenOutlineRounded />
        ) : (
          <MaterialSymbolsPictureInPictureAltRounded />
        )}
      </Button>
    </ToolbarTooltip>
  );
};

export default MiniPlayer;
