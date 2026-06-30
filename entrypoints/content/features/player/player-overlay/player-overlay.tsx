import { useIsMobile } from '@/components/hooks/use-mobile';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { usePlayer } from '../context/player-context';
import PlayerSidebar from '../sidebar/player-sidebar';
import ActionPopup from './action-popup';
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
  const { setOverlayRef, provider, miniPlayer, videoPiPActive } = usePlayer();
  const isMobile = useIsMobile();

  const isCompactMode = miniPlayer || videoPiPActive;

  return (
    <div
      className={cn(
        'absolute flex size-full',
        (adInProgress || provider === 'vidking') && 'pointer-events-none',
        videoPiPActive && !miniPlayer && 'flex-col justify-end',
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
          <ActionPopup />
          <BufferingIndicator />
          <div
            className={cn(
              'relative flex flex-col bg-gradient-to-t opacity-100 transition-opacity duration-300',
              isCompactMode
                ? 'from-black/45 to-transparent'
                : 'from-black/10 to-transparent',
              !isCompactMode && 'pb-20 md:pb-0',
              !uiShown && 'opacity-0',
            )}
          >
            <TooltipProvider>
              {!videoPiPActive && (
                <div
                  className={cn(
                    'flex w-full items-center',
                    isCompactMode ? 'px-2' : 'px-3 md:px-2',
                  )}
                >
                  <Time />
                </div>
              )}
              <div
                className={cn(
                  'flex w-full items-center',
                  isCompactMode
                    ? 'justify-center p-1 pt-0'
                    : 'justify-between p-3 pt-1 md:p-2',
                )}
              >
                <VideoToolbar />
              </div>
            </TooltipProvider>
          </div>
        </div>
      )}
      {!isCompactMode && !isMobile && (
        <PlayerSidebar toggleWatchedState={toggleWatchedState} />
      )}
    </div>
  );
};

export default PlayerOverlay;
