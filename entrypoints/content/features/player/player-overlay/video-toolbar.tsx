import { useRef } from 'react';

import { usePlayer } from '../context/player-context';
import Fullscreen from './buttons/fullscreen';
import MiniPlayer from './buttons/mini-player';
import Mute from './buttons/mute';
import Play from './buttons/play';
import Share from './buttons/share';
import TheatreMode from './buttons/theatre-mode';
import WatchTogether from './buttons/watch-together';
import Settings from './settings';
import Volume from './sliders/volume';
import TimeGroup from './time-group';

const GROUP =
  'border-shadow bg-background/60 flex items-center gap-1 rounded-lg p-1 backdrop-blur-xl';

const Divider = () => <div className="bg-border/70 mx-0.5 h-5 w-px shrink-0" />;

/** Mute button with a volume slider that slides out on hover or focus. */
const VolumeControl = () => (
  <div className="group/volume flex items-center">
    <Mute />
    <div className="w-0 overflow-hidden opacity-0 transition-[width,opacity] duration-200 ease-out group-hover/volume:w-24 group-hover/volume:opacity-100 group-has-focus-visible/volume:w-24 group-has-focus-visible/volume:opacity-100 has-data-dragging:w-24 has-data-dragging:opacity-100">
      <div className="w-24 px-2">
        <Volume />
      </div>
    </div>
  </div>
);

const VideoToolbar = () => {
  const { miniPlayer, videoPiPActive } = usePlayer();
  const mobileActionsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const isCompactMode = miniPlayer || videoPiPActive;

  if (isCompactMode) {
    return (
      <div className={cn(GROUP, 'min-w-0')}>
        <Play />
        <Mute />
        <Divider />
        <div className="min-w-0">
          <TimeGroup />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full items-center justify-between gap-2 md:hidden">
        <div className={cn(GROUP, 'min-w-0')}>
          <Play />
          <Mute />
          <Divider />
          <div className="min-w-0">
            <TimeGroup />
          </div>
        </div>
        <div ref={mobileActionsRef} className={cn(GROUP, 'shrink-0')}>
          <Settings anchor={mobileActionsRef} />
          <Fullscreen />
        </div>
      </div>
      <div className={cn(GROUP, 'hidden md:flex')}>
        <Play />
        <VolumeControl />
        <Divider />
        <TimeGroup />
      </div>
      <div ref={actionsRef} className={cn(GROUP, 'hidden md:flex')}>
        <WatchTogether anchor={actionsRef} />
        <Share anchor={actionsRef} />
        <Settings anchor={actionsRef} />
        <Divider />
        <MiniPlayer />
        <TheatreMode />
        <Fullscreen />
      </div>
    </>
  );
};

export default VideoToolbar;
