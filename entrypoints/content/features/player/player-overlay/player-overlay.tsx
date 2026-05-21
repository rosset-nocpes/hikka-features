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
  const { setOverlayRef, provider, miniPlayer } = usePlayer();

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
              'relative flex flex-col bg-gradient-to-t opacity-100 transition-opacity duration-300',
              miniPlayer ? 'from-black/45 to-transparent' : 'from-black/10 to-transparent',
              !uiShown && 'opacity-0',
            )}
          >
            <TooltipProvider>
              <div
                className={cn(
                  'flex w-full items-center',
                  miniPlayer ? 'px-2' : 'px-2',
                )}
              >
                <Time />
              </div>
              <div
                className={cn(
                  'flex w-full items-center',
                  miniPlayer ? 'justify-center p-1 pt-0' : 'justify-between p-2',
                )}
              >
                <VideoToolbar />
              </div>
            </TooltipProvider>
          </div>
        </div>
      )}
      {!miniPlayer && (
        <PlayerSidebar toggleWatchedState={toggleWatchedState} />
      )}
    </div>
  );
};

export default PlayerOverlay;
