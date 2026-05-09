import { TooltipProvider } from '@/components/ui/tooltip';

import { usePlayer } from '../context/player-context';
import PlayerSidebar from '../sidebar/player-sidebar';
import BufferingIndicator from './buffering-indicator';
import Time from './sliders/time';
import VideoToolbar from './video-toolbar';

interface Props {
  toggleWatchedState: (state: boolean) => void;
}

const PlayerOverlay = ({ toggleWatchedState }: Props) => {
  const { adInProgress, uiShown } = useIFramePlayer();
  const { setOverlayRef } = usePlayer();

  return (
    <div className="pointer-events-none absolute flex size-full">
      <div
        ref={setOverlayRef}
        className={cn(
          'relative flex flex-1 flex-col justify-end duration-300',
          (adInProgress || !uiShown) && 'opacity-0',
          !uiShown && 'cursor-none',
        )}
      >
        <BufferingIndicator />
        <div
          className={cn(
            'pointer-events-auto relative flex flex-col bg-gradient-to-t from-black/10 to-transparent opacity-100 transition-opacity duration-300',
            adInProgress && 'pointer-events-none',
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
      <PlayerSidebar
        className="pointer-events-auto"
        toggleWatchedState={toggleWatchedState}
      />
    </div>
  );
};

export default PlayerOverlay;
