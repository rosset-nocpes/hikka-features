import MaterialSymbolsFitScreenOutlineRounded from '~icons/material-symbols/fit-screen-outline-rounded';
import MaterialSymbolsPictureInPictureAltRounded from '~icons/material-symbols/picture-in-picture-alt-rounded';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { usePlayer } from '../../context/player-context';

const MiniPlayer = () => {
  const { overlayRef, miniPlayer, videoPiPActive, toggleMiniPlayer } =
    usePlayer();
  const { miniModeType } = useSettings().features.player;

  const isVideoNative = miniModeType === 'video-native';
  const isActive = isVideoNative ? videoPiPActive : miniPlayer;

  const handleClick = () => {
    if (isVideoNative) {
      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'piptoggle',
      });
    } else {
      toggleMiniPlayer();
    }
  };

  const tooltipText = isActive ? 'Вийти з мінірежиму' : 'Мінірежим';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={handleClick}>
          {isActive ? (
            <MaterialSymbolsFitScreenOutlineRounded />
          ) : (
            <MaterialSymbolsPictureInPictureAltRounded />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={32}
        collisionBoundary={overlayRef.current}
        collisionPadding={8}
      >
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
};

export default MiniPlayer;
