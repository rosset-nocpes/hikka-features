import {
  formatTime,
  Thumbnail,
  useMediaRemote,
  useMediaState,
  useSliderPreview,
} from '@vidstack/react';
import { useEffect, useState } from 'react';
import { Slider } from '../ui/slider';

export function Volume() {
  const volume = useMediaState('volume'),
    canSetVolume = useMediaState('canSetVolume'),
    remote = useMediaRemote();

  if (!canSetVolume) return null;

  return (
    <Slider
      className="group relative inline-flex h-10 w-full max-w-[80px] cursor-pointer touch-none select-none items-center outline-hidden"
      value={[volume * 100]}
      onValueChange={([value]) => {
        remote.changeVolume(value / 100);
      }}
    />
  );
}

export interface TimeSliderProps {
  thumbnails?: string;
}

export function Time({ thumbnails }: TimeSliderProps) {
  const time = useMediaState('currentTime'),
    canSeek = useMediaState('canSeek'),
    duration = useMediaState('duration'),
    seeking = useMediaState('seeking'),
    remote = useMediaRemote(),
    step = (1 / duration) * 100,
    [value, setValue] = useState(0),
    { previewRootRef, previewRef, previewValue } = useSliderPreview({
      clamp: true,
      offset: 6,
      orientation: 'horizontal',
    }),
    previewTime = (previewValue / 100) * duration;

  // Keep slider value in-sync with playback.
  useEffect(() => {
    if (seeking) return;
    setValue((time / duration) * 100);
  }, [time, duration]);

  return (
    <Slider
      className="group relative inline-flex h-9 w-full cursor-pointer touch-none select-none items-center outline-hidden"
      value={[value]}
      disabled={!canSeek}
      step={Number.isFinite(step) ? step : 1}
      ref={previewRootRef}
      onValueChange={([value]) => {
        setValue(value);
        remote.seeking((value / 100) * duration);
      }}
      onValueCommit={([value]) => {
        remote.seek((value / 100) * duration);
      }}
    />
  );
}
