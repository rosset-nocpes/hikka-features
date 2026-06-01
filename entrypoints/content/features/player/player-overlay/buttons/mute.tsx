import MaterialSymbolsVolumeDownOutlineRounded from '~icons/material-symbols/volume-down-outline-rounded';
import MaterialSymbolsVolumeOffOutlineRounded from '~icons/material-symbols/volume-off-outline-rounded';
import MaterialSymbolsVolumeUpOutlineRounded from '~icons/material-symbols/volume-up-outline-rounded';

import { Button } from '@/components/ui/button';
import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from '@/components/ui/tooltip';

import { usePlayer } from '../../context/player-context';

const Mute = () => {
  const { container, overlayRef } = usePlayer();
  const { isMuted, toggleMute, volume } = useIFramePlayer();

  const handleToggleMute = () => {
    toggleMute();
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" onClick={handleToggleMute}>
            {isMuted || volume === 0 ? (
              <MaterialSymbolsVolumeOffOutlineRounded className="size-5" />
            ) : volume < 0.5 ? (
              <MaterialSymbolsVolumeDownOutlineRounded className="size-5" />
            ) : (
              <MaterialSymbolsVolumeUpOutlineRounded className="size-5" />
            )}
          </Button>
        }
      />
      <TooltipContent
        side="top"
        align="center"
        sideOffset={32}
        collisionBoundary={overlayRef.current as Element}
        collisionPadding={8}
        container={container}
      >
        {isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
      </TooltipContent>
    </Tooltip>
  );
};

export default Mute;
