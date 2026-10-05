import MaterialSymbolsVolumeDownOutlineRounded from '~icons/material-symbols/volume-down-outline-rounded';
import MaterialSymbolsVolumeOffOutlineRounded from '~icons/material-symbols/volume-off-outline-rounded';
import MaterialSymbolsVolumeUpOutlineRounded from '~icons/material-symbols/volume-up-outline-rounded';

import { Button } from '@/components/ui/button';

import ToolbarTooltip from '../toolbar-tooltip';

const Mute = () => {
  const { isMuted, toggleMute, volume } = useIFramePlayer();

  const handleToggleMute = () => {
    toggleMute();
  };

  return (
    <ToolbarTooltip label={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}>
      <Button variant="ghost" size="icon-sm" onClick={handleToggleMute}>
        {isMuted || volume === 0 ? (
          <MaterialSymbolsVolumeOffOutlineRounded className="size-5" />
        ) : volume < 0.5 ? (
          <MaterialSymbolsVolumeDownOutlineRounded className="size-5" />
        ) : (
          <MaterialSymbolsVolumeUpOutlineRounded className="size-5" />
        )}
      </Button>
    </ToolbarTooltip>
  );
};

export default Mute;
