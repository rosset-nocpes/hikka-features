import MaterialSymbolsFullscreenExitRounded from '~icons/material-symbols/fullscreen-exit-rounded';
import MaterialSymbolsFullscreenRounded from '~icons/material-symbols/fullscreen-rounded';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { usePlayer } from '../../context/player-context';

const Fullscreen = () => {
  const { fullscreen, toggleFullscreen } = usePlayer();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen}>
          {fullscreen ? (
            <MaterialSymbolsFullscreenExitRounded />
          ) : (
            <MaterialSymbolsFullscreenRounded />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        // className={tooltipClass}
        side="top"
        align="center"
        sideOffset={32}
        // collisionBoundary={player?.el}
        // collisionPadding={8}
      >
        {fullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'}
      </TooltipContent>
    </Tooltip>
  );
};

export default Fullscreen;
