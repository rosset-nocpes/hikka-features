import MaterialSymbolsFitScreenOutlineRounded from '~icons/material-symbols/fit-screen-outline-rounded';
import MaterialSymbolsWidthFullOutline from '~icons/material-symbols/width-full-outline';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { usePlayer } from '../../context/player-context';

const TheatreMode = () => {
  const { container, overlayRef, theatreMode, toggleTheatreMode } = usePlayer();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" onClick={toggleTheatreMode}>
            {theatreMode ? (
              <MaterialSymbolsFitScreenOutlineRounded />
            ) : (
              <MaterialSymbolsWidthFullOutline />
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
        {theatreMode ? 'Вийти з режиму теару' : 'Режим теару'}
      </TooltipContent>
    </Tooltip>
  );
};

export default TheatreMode;
