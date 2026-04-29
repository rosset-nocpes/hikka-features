import { useEffect, useState } from 'react';

import BaseSlider from './base-slider';

const Time = () => {
  // const {
  //   currentTime: time,
  //   canSeek,
  //   duration,
  //   seeking,
  //   buffered,
  // } = useMediaStore();
  const { currentTime, duration, isPlaying, isMuted, seek } = useIFramePlayer();

  // const remote = useMediaRemote();
  const step = (1 / duration) * 100;
  const [value, setValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  // const { previewRootRef, previewRef, previewValue } = useSliderPreview({
  //   clamp: true,
  //   offset: 6,
  //   orientation: 'horizontal',
  // });
  // const previewTime = (previewValue / 100) * duration;

  // const bufferSegments = React.useMemo(() => {
  //   if (!buffered || !duration) return [];
  //   const segments = [];
  //   for (let i = 0; i < buffered.length; i++) {
  //     const start = buffered.start(i);
  //     const end = buffered.end(i);
  //     segments.push({
  //       start: (start / duration) * 100,
  //       end: (end / duration) * 100,
  //     });
  //   }
  //   return segments;
  // }, [buffered, duration]);

  useEffect(() => {
    if (isSeeking) return;
    setValue((currentTime / duration) * 100);
  }, [currentTime, duration, isSeeking]);

  const canSeek = true;

  const handleValueChange = (newValue: number[]) => {
    setValue(newValue[0]);
    if (isSeeking) {
      seek((newValue[0] / 100) * duration);
    }
  };

  return (
    <BaseSlider
      className="group relative inline-flex w-full cursor-pointer touch-none select-none pb-1 pt-6 outline-none"
      value={[value]}
      disabled={!canSeek}
      step={Number.isFinite(step) ? step : 1}
      // ref={previewRootRef}
      onValueChange={handleValueChange}
      onPointerDown={() => setIsSeeking(true)}
      onPointerUp={() => {
        setIsSeeking(false);
      }}
      onValueCommit={([value]) => {
        seek((value / 100) * duration);
      }}
      // bufferSegments={bufferSegments}
    >
      <div
        className="pointer-events-none absolute flex flex-col items-center opacity-0 transition-opacity duration-200 will-change-[left] data-[visible]:opacity-100"
        // ref={previewRef}
      >
        {/*{thumbnails ? (
          <Thumbnail.Root
            src={thumbnails}
            time={previewTime}
            className="mb-2 block h-[var(--thumbnail-height)] max-h-[160px] min-h-[80px] w-[var(--thumbnail-width)] min-w-[120px] max-w-[180px] overflow-hidden rounded-lg border bg-background"
          >
            <Thumbnail.Img />
          </Thumbnail.Root>
        ) : null}*/}
        <span className="min-w-14 rounded-lg bg-background/60 px-2 py-1 text-center text-sm backdrop-blur-xl">
          {/*{formatTime(previewTime)}*/}
        </span>
      </div>
    </BaseSlider>
  );
};

export default Time;
