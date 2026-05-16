import { TooltipProvider } from '@/components/ui/tooltip';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { usePlayer } from '../context/player-context';
import PlayerSidebar from '../sidebar/player-sidebar';
import BufferingIndicator from './buffering-indicator';
import Gestrues from './gestrues';
import Time from './sliders/time';
import SpeedupPopup from './speedup-popup';
import VideoToolbar from './video-toolbar';

interface Props {
  toggleWatchedState: (state: boolean) => void;
}

const PlayerOverlay = ({ toggleWatchedState }: Props) => {
  const { adInProgress, uiShown } = useIFramePlayer();
  const { setOverlayRef, provider } = usePlayer();

  return (
    <div
      className={cn(
        'absolute flex size-full',
        adInProgress && 'pointer-events-none',
      )}
    >
      {provider !== 'vidking' && (
        <div
          ref={setOverlayRef}
          className={cn(
            'relative flex flex-1 flex-col justify-end duration-300',
            adInProgress && 'opacity-0',
            !uiShown && 'cursor-none',
          )}
        >
          <Gestrues />
          <SpeedupPopup />
          <BufferingIndicator />
          <div
            className={cn(
              'relative flex flex-col bg-gradient-to-t from-black/10 to-transparent opacity-100 transition-opacity duration-300',
              !uiShown && 'opacity-0',
            )}
          >
            <TooltipProvider>
              <div className="flex w-full items-center px-2">
                <Time />
              </div>
              <div className="flex w-full items-center justify-between p-2">
                <VideoToolbar />
              </div>
            </TooltipProvider>
          </div>
        </div>
      )}
      <PlayerSidebar toggleWatchedState={toggleWatchedState} />
    </div>
  );
};

export default PlayerOverlay;
