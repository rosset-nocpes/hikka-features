import MaterialSymbolsFullscreenExitRounded from '~icons/material-symbols/fullscreen-exit-rounded';
import MaterialSymbolsFullscreenRounded from '~icons/material-symbols/fullscreen-rounded';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const Fullscreen = () => {
  // const player = useMediaPlayer();
  // const isActive = useMediaState('fullscreen');

  const isActive = false;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          {isActive ? (
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
        {isActive ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'}
      </TooltipContent>
    </Tooltip>
  );
};

export default Fullscreen;
