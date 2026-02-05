import { useVideoQualityOptions } from '@vidstack/react';
import { DoorClosed, Pi } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '../ui/button';
import * as Buttons from './buttons';
import Settings from './settings';
import * as Sliders from './sliders';
import { TimeGroup } from './time-group';

const VideoToolbar = () => {
  const options = useVideoQualityOptions({ auto: false, sort: 'descending' });

  useEffect(() => {
    if (options.length === 0) return;

    options[0].select();
  }, [options]);

  return (
    <>
      <div className="flex gap-2">
        <div className="flex gap-1 rounded-lg bg-background/60 p-1 backdrop-blur-xl">
          <Buttons.Play />
          <Buttons.Mute />
          <Sliders.Volume />
        </div>
        <div className="flex gap-1 rounded-lg bg-background/60 px-2 backdrop-blur-xl">
          <TimeGroup />
        </div>
      </div>
      <div className="flex gap-1 rounded-lg bg-background/60 p-1 backdrop-blur-xl">
        <Buttons.PlayerShareLinkButton />
        <Settings />
        <Buttons.Fullscreen />
      </div>
    </>
  );
};

export default VideoToolbar;
