import { useRef, useState } from 'react';

import { MediaDivider, VolumeSlideOut } from '@/components/media/controls';

import { compactMode, usePlayer } from '../context/player-context';
import NextInQueue from '../queue/next-in-queue';
import Share from './buttons/share';
import {
  Fullscreen,
  MiniPlayer,
  Mute,
  Play,
  TheatreMode,
  TimeGroup,
} from './buttons/toggles';
import WatchTogether from './buttons/watch-together';
import Settings from './settings';

// Concentric: the buttons' radius plus the padding and the border. Square,
// like the buttons, when the user's hikka theme squares the corners (`min`
// with the radius, which is then 0).
const GROUP =
  'player-glass flex items-center gap-1 rounded-[min(calc(var(--radius-md)+4px),var(--radius)*100)] border p-[3px]';

/**
 * Mute button with a volume slider that slides out on hover or focus. Like
 * YouTube, once opened it stays open while the pointer is anywhere in the left
 * controls or the empty space after them (`open`, cleared by the toolbar).
 */
const VolumeControl = ({
  open,
  onOpen,
}: {
  open: boolean;
  onOpen: () => void;
}) => {
  const volume = useIFramePlayer((state) => state.volume);
  const isMuted = useIFramePlayer((state) => state.isMuted);
  const changeVolume = useIFramePlayer((state) => state.changeVolume);
  return (
    <VolumeSlideOut
      wide
      open={open}
      onOpen={onOpen}
      volume={isMuted ? 0 : volume}
      onChange={changeVolume}
    >
      <Mute />
    </VolumeSlideOut>
  );
};

/** Play, skip, mute and the time, for toolbars too narrow for the slider. */
const CompactGroup = () => (
  <div className={cn(GROUP, 'min-w-0')}>
    <Play />
    <NextInQueue />
    <Mute />
    <MediaDivider />
    <div className="min-w-0">
      <TimeGroup />
    </div>
  </div>
);

const VideoToolbar = () => {
  const isCompactMode = usePlayer(compactMode);
  const mobileActionsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [volumeOpen, setVolumeOpen] = useState(false);

  if (isCompactMode) return <CompactGroup />;

  return (
    <>
      <div className="flex w-full items-center justify-between gap-2 md:hidden">
        <CompactGroup />
        <div ref={mobileActionsRef} className={cn(GROUP, 'shrink-0')}>
          <Settings anchor={mobileActionsRef} />
          <Fullscreen />
        </div>
      </div>
      {/* Spans the gap up to the right group, so the volume slider stays
          open while the pointer is anywhere left of it. */}
      <div
        className="hidden min-w-0 flex-1 self-stretch md:flex md:items-center"
        onPointerLeave={() => setVolumeOpen(false)}
      >
        <div className={GROUP}>
          <Play />
          <NextInQueue />
          <VolumeControl open={volumeOpen} onOpen={() => setVolumeOpen(true)} />
          <MediaDivider />
          <TimeGroup />
        </div>
      </div>
      <div ref={actionsRef} className={cn(GROUP, 'hidden md:flex')}>
        <WatchTogether anchor={actionsRef} />
        <Share anchor={actionsRef} />
        <Settings anchor={actionsRef} />
        <MediaDivider />
        <MiniPlayer />
        <TheatreMode />
        <Fullscreen />
      </div>
    </>
  );
};

export default VideoToolbar;
