import MaterialSymbolsFitScreenOutlineRounded from '~icons/material-symbols/fit-screen-outline-rounded';
import MaterialSymbolsWidthFullOutline from '~icons/material-symbols/width-full-outline';

import { Button } from '@/components/ui/button';

import { usePlayer } from '../../context/player-context';
import ToolbarTooltip from '../toolbar-tooltip';

const TheatreMode = () => {
  const { theatreMode, toggleTheatreMode } = usePlayer();

  return (
    <ToolbarTooltip
      label={theatreMode ? 'Вийти з режиму теару' : 'Режим теару'}
    >
      <Button variant="ghost" size="icon-sm" onClick={toggleTheatreMode}>
        {theatreMode ? (
          <MaterialSymbolsFitScreenOutlineRounded />
        ) : (
          <MaterialSymbolsWidthFullOutline />
        )}
      </Button>
    </ToolbarTooltip>
  );
};

export default TheatreMode;
