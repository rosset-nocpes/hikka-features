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
  const { miniPlayer } = usePlayer();

  if (miniPlayer) {
    return (
      <div className="border-shadow flex max-w-full items-center gap-1 rounded-md bg-background/70 p-1 backdrop-blur-xl">
        <Play />
        <Mute />
        <div className="mx-1 h-5 w-px bg-border/70" />
        <div className="px-1">
          <TimeGroup />
        </div>
        <div className="mx-1 h-5 w-px bg-border/70" />
        <MiniPlayer />
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full items-center justify-between gap-2 md:hidden">
        <div className="border-shadow flex min-w-0 items-center gap-1 rounded-lg bg-background/60 p-1 backdrop-blur-xl">
          <Play />
          <Mute />
          <div className="mx-1 h-5 w-px shrink-0 bg-border/70" />
          <div className="min-w-0 px-1">
            <TimeGroup />
          </div>
        </div>
        <div className="border-shadow flex shrink-0 gap-1 rounded-lg bg-background/60 p-1 backdrop-blur-xl">
          <Settings />
          <Fullscreen />
        </div>
      </div>
      <div className="hidden gap-2 md:flex">
        <div className="border-shadow flex gap-1 rounded-lg bg-background/60 p-1 backdrop-blur-xl">
          <Play />
          <Mute />
          <Volume />
        </div>
        <div className="border-shadow flex gap-1 rounded-lg bg-background/60 px-2 backdrop-blur-xl">
          <TimeGroup />
        </div>
      </div>
      <div className="border-shadow hidden gap-1 rounded-lg bg-background/60 p-1 backdrop-blur-xl md:flex">
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
