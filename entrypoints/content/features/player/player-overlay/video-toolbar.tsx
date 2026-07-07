import { usePlayer } from '../context/player-context';
import Fullscreen from './buttons/fullscreen';
import MiniPlayer from './buttons/mini-player';
import Mute from './buttons/mute';
import Play from './buttons/play';
import Share from './buttons/share';
import TheatreMode from './buttons/theatre-mode';
import Settings from './settings';
import Volume from './sliders/volume';
import TimeGroup from './time-group';

const VideoToolbar = () => {
  const { miniPlayer, videoPiPActive } = usePlayer();

  const isCompactMode = miniPlayer || videoPiPActive;

  if (isCompactMode) {
    return (
      <div className="border-shadow bg-background/70 flex max-w-full items-center gap-1 rounded-md p-1 backdrop-blur-xl">
        <Play />
        <Mute />
        <div className="bg-border/70 mx-1 h-5 w-px" />
        <div className="px-1">
          <TimeGroup />
        </div>
        <div className="bg-border/70 mx-1 h-5 w-px" />
        <MiniPlayer />
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full items-center justify-between gap-2 md:hidden">
        <div className="border-shadow bg-background/60 flex min-w-0 items-center gap-1 rounded-lg p-1 backdrop-blur-xl">
          <Play />
          <Mute />
          <div className="bg-border/70 mx-1 h-5 w-px shrink-0" />
          <div className="min-w-0 px-1">
            <TimeGroup />
          </div>
        </div>
        <div className="border-shadow bg-background/60 flex shrink-0 gap-1 rounded-lg p-1 backdrop-blur-xl">
          <Settings />
          <Fullscreen />
        </div>
      </div>
      <div className="hidden gap-2 md:flex">
        <div className="border-shadow bg-background/60 flex gap-1 rounded-lg p-1 backdrop-blur-xl">
          <Play />
          <Mute />
          <Volume />
        </div>
        <div className="border-shadow bg-background/60 flex gap-1 rounded-lg px-2 backdrop-blur-xl">
          <TimeGroup />
        </div>
      </div>
      <div className="border-shadow bg-background/60 hidden gap-1 rounded-lg p-1 backdrop-blur-xl md:flex">
        <Share />
        <Settings />
        <MiniPlayer />
        <TheatreMode />
        <Fullscreen />
      </div>
    </>
  );
};

export default VideoToolbar;
