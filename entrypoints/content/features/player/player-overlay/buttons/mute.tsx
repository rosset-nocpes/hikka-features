import MaterialSymbolsVolumeDownOutlineRounded from '~icons/material-symbols/volume-down-outline-rounded';
import MaterialSymbolsVolumeOffOutlineRounded from '~icons/material-symbols/volume-off-outline-rounded';
import MaterialSymbolsVolumeUpOutlineRounded from '~icons/material-symbols/volume-up-outline-rounded';

import { Button } from '@/components/ui/button';
import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from '@/components/ui/tooltip';

const Mute = () => {
  const { isMuted, toggleMute, volume } = useIFramePlayer();

  const handleToggleMute = () => {
    toggleMute();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={handleToggleMute}>
          {isMuted || volume === 0 ? (
            <MaterialSymbolsVolumeOffOutlineRounded className="text-lg" />
          ) : volume < 0.5 ? (
            <MaterialSymbolsVolumeDownOutlineRounded className="text-lg" />
          ) : (
            <MaterialSymbolsVolumeUpOutlineRounded className="text-lg" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        // className={tooltipClass}
        side="top"
        align="center"
        sideOffset={32}
        // collisionBoundary={player?.el}
        collisionPadding={8}
      >
        {isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
      </TooltipContent>
    </Tooltip>
  );
};

export default Mute;
