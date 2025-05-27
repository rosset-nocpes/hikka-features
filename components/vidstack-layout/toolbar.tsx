import { useVideoQualityOptions } from '@vidstack/react';
import { DoorClosed, Pi } from 'lucide-react';
import { Button } from '../ui/button';
import * as Buttons from './buttons';

const VideoToolbar = () => {
  const options = useVideoQualityOptions({ auto: false, sort: 'descending' });

  useEffect(() => {
    if (options.length === 0) return;

    options[0].select();
  }, [options]);

  return (
    <div className="flex gap-1 rounded-lg bg-background/60 p-1 backdrop-blur-xl">
      <Buttons.Play />
      <Buttons.Mute />
    </div>
  );
};

export default VideoToolbar;
