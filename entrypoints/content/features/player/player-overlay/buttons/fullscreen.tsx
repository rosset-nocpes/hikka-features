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
  const { container, overlayRef, fullscreen, toggleFullscreen } = usePlayer();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen}>
            {fullscreen ? (
              <MaterialSymbolsFullscreenExitRounded />
            ) : (
              <MaterialSymbolsFullscreenRounded />
            )}
          </Button>
        }
      />
      <TooltipContent
        side="top"
        sideOffset={32}
        align="center"
        collisionBoundary={overlayRef.current as Element}
        collisionPadding={8}
        container={container}
      >
        {fullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'}
      </TooltipContent>
    </Tooltip>
  );
};

export default Fullscreen;
