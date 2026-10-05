import MaterialSymbolsPauseOutlineRounded from '~icons/material-symbols/pause-outline-rounded';
import MaterialSymbolsPlayArrowOutlineRounded from '~icons/material-symbols/play-arrow-outline-rounded';

import { Button } from '@/components/ui/button';

import ToolbarTooltip from '../toolbar-tooltip';

const Play = () => {
  const { isPlaying, play, pause } = useIFramePlayer();

  const handlePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <ToolbarTooltip label={isPlaying ? 'Призупинити' : 'Відтворити'}>
      <Button variant="ghost" size="icon-sm" onClick={handlePlay}>
        {isPlaying ? (
          <MaterialSymbolsPauseOutlineRounded className="size-5" />
        ) : (
          <MaterialSymbolsPlayArrowOutlineRounded className="size-5" />
        )}
      </Button>
    </ToolbarTooltip>
  );
};

export default Play;
