import { useRef, useState } from 'react';

import { compactMode, usePlayer } from '../context/player-context';
import NextInQueue from '../queue/next-in-queue';
import Share from './buttons/share';
import {
  Fullscreen,
  MiniPlayer,
  Mute,
  Play,
  TheatreMode,
} from './buttons/toggles';
import WatchTogether from './buttons/watch-together';
import Settings from './settings';
import Volume from './sliders/volume';
import TimeGroup from './time-group';

// Concentric: the buttons' radius plus the padding and the border. Square,
// like the buttons, when the user's hikka theme squares the corners (`min`
// with the radius, which is then 0).
const GROUP =
  'player-glass flex items-center gap-1 rounded-[min(calc(var(--radius-md)+4px),var(--radius)*100)] border p-[3px]';

const Divider = () => <div className="bg-border mx-0.5 h-5 w-px shrink-0" />;

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
}) => (
  <div
    className="group/volume flex items-center"
    onPointerEnter={(e) => e.pointerType === 'mouse' && onOpen()}
  >
    <Mute />
    <div
      className={cn(
        'w-0 overflow-hidden opacity-0 transition-[width,opacity] duration-200 ease-out group-hover/volume:w-24 group-hover/volume:opacity-100 group-has-focus-visible/volume:w-24 group-has-focus-visible/volume:opacity-100 has-data-dragging:w-24 has-data-dragging:opacity-100 motion-reduce:transition-opacity',
        open && 'w-24 opacity-100',
      )}
    >
      <div className="w-24 px-2">
        <Volume />
      </div>
    </div>
  </div>
);

/** Play, skip, mute and the time, for toolbars too narrow for the slider. */
const CompactGroup = () => (
  <div className={cn(GROUP, 'min-w-0')}>
    <Play />
    <NextInQueue />
    <Mute />
    <Divider />
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
          <Divider />
          <TimeGroup />
        </div>
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
