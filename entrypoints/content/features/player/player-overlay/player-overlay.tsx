import { TooltipProvider } from '@/components/ui/tooltip';

import { usePlayer } from '../context/player-context';
import PlayerSidebar from '../sidebar/player-sidebar';
import Time from './sliders/time';
import VideoToolbar from './video-toolbar';

interface Props {
  toggleWatchedState: (state: boolean) => void;
}

const PlayerOverlay = ({ toggleWatchedState }: Props) => {
  const { setOverlayRef } = usePlayer();

  return (
    <div className="pointer-events-none absolute flex size-full">
      <div
        ref={setOverlayRef}
        className="relative flex flex-1 flex-col justify-end"
      >
        <div
          className={cn(
            'pointer-events-auto relative flex flex-col bg-gradient-to-t from-black/10 to-transparent opacity-100 transition-opacity duration-300',
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
