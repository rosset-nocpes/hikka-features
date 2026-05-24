import MaterialSymbolsPauseOutlineRounded from '~icons/material-symbols/pause-outline-rounded';
import MaterialSymbolsPlayArrowOutlineRounded from '~icons/material-symbols/play-arrow-outline-rounded';

import { Button } from '@/components/ui/button';
import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from '@/components/ui/tooltip';

import { usePlayer } from '../../context/player-context';

const Play = () => {
  const { overlayRef } = usePlayer();
  const { isPlaying, play, pause } = useIFramePlayer();

  const handlePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={handlePlay}>
          {isPlaying ? (
            <MaterialSymbolsPauseOutlineRounded className="text-lg" />
          ) : (
            <MaterialSymbolsPlayArrowOutlineRounded className="text-lg" />
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
        {isPlaying ? 'Призупинити' : 'Відтворити'}
      </TooltipContent>
    </Tooltip>
  );
};

export default Play;
