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
  const { overlayRef, theatreMode, toggleTheatreMode } = usePlayer();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={toggleTheatreMode}>
          {theatreMode ? (
            <MaterialSymbolsFitScreenOutlineRounded />
          ) : (
            <MaterialSymbolsWidthFullOutline />
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
        {theatreMode ? 'Вийти з режиму теару' : 'Режим теару'}
      </TooltipContent>
    </Tooltip>
  );
};

export default TheatreMode;
