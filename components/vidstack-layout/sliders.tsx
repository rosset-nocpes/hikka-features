import {
  formatTime,
  Thumbnail,
  useMediaRemote,
  useMediaState,
  useMediaStore,
  useSliderPreview,
} from '@vidstack/react';
import { useEffect, useState } from 'react';

('use client');

import { Slider as SliderPrimitive } from 'radix-ui';
import * as React from 'react';

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    bufferSegments?: {
      start: number;
      end: number;
    }[];
  }
>(({ className, children, bufferSegments, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-secondary duration-100 group-hover:scale-y-150">
      {bufferSegments?.map((segment, index) => (
        <div
          key={index}
          className="absolute h-full bg-secondary-foreground/30"
          style={{
            left: `${segment.start}%`,
            width: `${segment.end - segment.start}%`,
          }}
        />
      ))}
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block size-3 rounded-full border-2 border-primary bg-background duration-100 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 group-hover:scale-150" />
    {children}
  </SliderPrimitive.Root>
));

export function Volume() {
  const volume = useMediaState('volume'),
    canSetVolume = useMediaState('canSetVolume'),
    remote = useMediaRemote();

  if (!canSetVolume) return null;

  return (
    <Slider
      className="group mr-1 h-8 w-[80px] cursor-pointer touch-none select-none outline-none"
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
  const { currentTime: time, canSeek, duration, seeking, buffered } = useMediaStore();

  const remote = useMediaRemote();
  const step = (1 / duration) * 100;
  const [value, setValue] = useState(0);
  const { previewRootRef, previewRef, previewValue } = useSliderPreview({
    clamp: true,
    offset: 6,
    orientation: 'horizontal',
  });
  const previewTime = (previewValue / 100) * duration;

  const bufferSegments = React.useMemo(() => {
    if (!buffered || !duration) return [];
    const segments = [];
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      segments.push({
        start: (start / duration) * 100,
        end: (end / duration) * 100,
      });
    }
    return segments;
  }, [buffered, duration]);

  useEffect(() => {
    if (seeking) return;
    setValue((time / duration) * 100);
  }, [time, duration]);

  return (
    <Slider
      className="group relative inline-flex w-full cursor-pointer touch-none select-none pt-6 pb-1 outline-none"
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
      bufferSegments={bufferSegments}
    >
      <div
        className="pointer-events-none absolute flex flex-col items-center opacity-0 transition-opacity duration-200 will-change-[left] data-[visible]:opacity-100"
        ref={previewRef}
      >
        {thumbnails ? (
          <Thumbnail.Root
            src={thumbnails}
            time={previewTime}
            className="mb-2 block h-[var(--thumbnail-height)] max-h-[160px] min-h-[80px] w-[var(--thumbnail-width)] min-w-[120px] max-w-[180px] overflow-hidden rounded-lg border bg-background"
          >
            <Thumbnail.Img />
          </Thumbnail.Root>
        ) : null}
        <span className="min-w-14 rounded-lg bg-background/60 px-2 py-1 text-center text-sm backdrop-blur-xl">
          {formatTime(previewTime)}
        </span>
      </div>
    </Slider>
  );
}
