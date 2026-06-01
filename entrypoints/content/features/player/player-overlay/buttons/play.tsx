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
  const { container, overlayRef } = usePlayer();
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
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" onClick={handlePlay}>
            {isPlaying ? (
              <MaterialSymbolsPauseOutlineRounded className="size-5" />
            ) : (
              <MaterialSymbolsPlayArrowOutlineRounded className="size-5" />
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
        {isPlaying ? 'Призупинити' : 'Відтворити'}
      </TooltipContent>
    </Tooltip>
  );
};

export default Play;
