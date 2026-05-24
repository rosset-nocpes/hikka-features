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
  const { overlayRef, miniPlayer, toggleMiniPlayer } = usePlayer();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={toggleMiniPlayer}>
          {miniPlayer ? (
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
        {miniPlayer ? 'Вийти з міні-плеєра' : 'Міні-плеєр'}
      </TooltipContent>
    </Tooltip>
  );
};

export default MiniPlayer;
