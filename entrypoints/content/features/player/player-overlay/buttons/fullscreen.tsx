import MaterialSymbolsFullscreenExitRounded from '~icons/material-symbols/fullscreen-exit-rounded';
import MaterialSymbolsFullscreenRounded from '~icons/material-symbols/fullscreen-rounded';

import { Button } from '@/components/ui/button';

import { usePlayer } from '../../context/player-context';
import ToolbarTooltip from '../toolbar-tooltip';

const Fullscreen = () => {
  const { fullscreen, toggleFullscreen } = usePlayer();

  return (
    <ToolbarTooltip
      label={
        fullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'
      }
    >
      <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen}>
        {fullscreen ? (
          <MaterialSymbolsFullscreenExitRounded />
        ) : (
          <MaterialSymbolsFullscreenRounded />
        )}
      </Button>
    </ToolbarTooltip>
  );
};

export default Fullscreen;
