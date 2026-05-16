import Fullscreen from './buttons/fullscreen';
import Mute from './buttons/mute';
import Play from './buttons/play';
import Share from './buttons/share';
import TheatreMode from './buttons/theatre-mode';
import Settings from './settings';
import Volume from './sliders/volume';
import TimeGroup from './time-group';

const VideoToolbar = () => {
  // const options = useVideoQualityOptions({ auto: false, sort: 'descending' });

  // useEffect(() => {
  //   if (options.length === 0) return;

  //   options[0].select();
  // }, [options]);

  return (
    <>
      <div className="flex gap-2">
        <div className="border-shadow flex gap-1 rounded-lg bg-background/60 p-1 backdrop-blur-xl">
          <Play />
          <Mute />
          <Volume />
        </div>
        <div className="border-shadow flex gap-1 rounded-lg bg-background/60 px-2 backdrop-blur-xl">
          <TimeGroup />
        </div>
      </div>
      <div className="border-shadow flex gap-1 rounded-lg bg-background/60 p-1 backdrop-blur-xl">
        <Share />
        <Settings />
        <TheatreMode />
        <Fullscreen />
      </div>
    </>
  );
};

export default VideoToolbar;
