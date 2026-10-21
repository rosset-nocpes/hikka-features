import { useRef } from 'react';

import { useIsMobile } from '@/components/hooks/use-mobile';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { usePlayer } from '../context/player-context';
import { useStackedLayout } from '../mobile/use-stacked-layout';
import PlayerSidebar from '../sidebar/player-sidebar';
import ActionPopup from './action-popup';
import BufferingIndicator from './buffering-indicator';
import Gestures from './gestures';
import Time from './sliders/time';
import VideoToolbar from './video-toolbar';

const PlayerOverlay = () => {
  const { adInProgress, uiShown } = useIFramePlayer();
  const { setOverlay, miniPlayer, videoPiPActive } = usePlayer();
  const isMobile = useIsMobile();
  const stacked = useStackedLayout();

  const isCompactMode = miniPlayer || videoPiPActive;
  const swallowTapRef = useRef(false);

  // A tap on hidden controls only reveals them, so it can't hit a button
  // the user can't see.
  const handlePointerDownCapture = (e: React.PointerEvent) => {
    swallowTapRef.current =
      e.pointerType !== 'mouse' && !useIFramePlayer.getState().uiShown;
    if (!swallowTapRef.current) return;
    e.stopPropagation();
    useIFramePlayer.setState({ uiShown: true });
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (!swallowTapRef.current) return;
    swallowTapRef.current = false;
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      className={cn(
        'absolute flex',
        // Stacked, the overlay covers the video only, not the panel below.
        stacked ? 'inset-x-0 top-0 aspect-video' : 'size-full',
        adInProgress && 'pointer-events-none',
        videoPiPActive && !miniPlayer && 'flex-col justify-end',
      )}
    >
      <div
        ref={setOverlay}
        className={cn(
          'relative flex flex-1 flex-col justify-end duration-300',
          adInProgress && 'opacity-0',
          !uiShown && 'cursor-none',
        )}
      >
        <Gestures />
        <ActionPopup />
        <BufferingIndicator />
        <div
          data-player-controls
          onPointerDownCapture={handlePointerDownCapture}
          onClickCapture={handleClickCapture}
          className={cn(
            'relative isolate flex flex-col opacity-100 transition-opacity duration-300',
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
                  ? 'justify-between p-2 pt-1'
                  : 'justify-between p-3 pt-1 md:p-2',
              )}
            >
              <VideoToolbar />
            </div>
          </TooltipProvider>
        </div>
      </div>
      {!isCompactMode && !isMobile && <PlayerSidebar />}
    </div>
  );
};

export default PlayerOverlay;
