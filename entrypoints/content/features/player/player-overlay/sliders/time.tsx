import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { useCallback, useEffect, useRef, useState } from 'react';

import { usePlayer } from '../../context/player-context';
import { formatTime } from '../time-group';

const useSeeking = (duration: number, seek: (t: number) => void) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const seekTargetRef = useRef<number | null>(null);

  const seekToSliderValue = (sliderValue: number) => {
    const target = (sliderValue / 100) * duration;
    seekTargetRef.current = target;
    seek(target);
  };

  const shouldSkipSync = useCallback((currentTime: number): boolean => {
    if (seekTargetRef.current === null) return false;
    if (Math.abs(currentTime - seekTargetRef.current) > 1) return true;
    seekTargetRef.current = null;
    return false;
  }, []);

  return { isSeeking, setIsSeeking, seekToSliderValue, shouldSkipSync };
};

const useSliderTooltip = ({
  isSeeking,
  duration,
  step,
  overlayRef,
}: {
  isSeeking: boolean;
  duration: number;
  step: number;
  overlayRef: React.RefObject<HTMLElement | null>;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const COLLISION_PADDING = 8;

  const updateFromClientX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const raw = percent * duration;
      const stepped = Math.round(raw / step) * step;
      setHoverTime(Math.max(0, Math.min(duration, stepped)));
      setHoverX(clientX);
    },
    [duration, step],
  );

  const handleMouseMove = (e: React.MouseEvent) => updateFromClientX(e.clientX);

  const handleMouseLeave = () => {
    if (isSeeking) return;
    setHoverTime(null);
    setHoverX(null);
  };

  // Follow pointer globally while dragging
  useEffect(() => {
    if (!isSeeking) return;

    const onMove = (e: PointerEvent) => updateFromClientX(e.clientX);
    const onUp = () => {
      setHoverTime(null);
      setHoverX(null);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [isSeeking, updateFromClientX]);

  // Collision-aware positioning
  useEffect(() => {
    if (!tooltipRef.current || hoverX === null || hoverTime === null) return;

    const { width: tw, height: th } =
      tooltipRef.current.getBoundingClientRect();
    const container = overlayRef.current?.getBoundingClientRect() ?? {
      left: COLLISION_PADDING,
      top: COLLISION_PADDING,
      right: window.innerWidth - COLLISION_PADDING,
      bottom: window.innerHeight - COLLISION_PADDING,
    };

    const trackTop = trackRef.current?.getBoundingClientRect().top ?? hoverX;
    let x = hoverX;
    let y = trackTop - 32;

    if (y - th / 2 < container.top + COLLISION_PADDING) y = trackTop + 16;

    const halfW = tw / 2;
    x = Math.max(
      container.left + COLLISION_PADDING + halfW,
      Math.min(container.right - COLLISION_PADDING - halfW, x),
    );

    setTooltipStyle({ left: x, top: y });
  }, [hoverX, hoverTime, overlayRef]);

  return {
    trackRef,
    tooltipRef,
    hoverTime,
    hoverX,
    tooltipStyle,
    handleMouseMove,
    handleMouseLeave,
  };
};

const Time = () => {
  const { currentTime, duration, seek, bufferedTime, checkBuffering } =
    useIFramePlayer();
  const { overlayRef, miniPlayer } = usePlayer();

  const step = duration > 0 ? (1 / duration) * 100 : 1;
  const [value, setValue] = useState(0);

  const { isSeeking, setIsSeeking, seekToSliderValue, shouldSkipSync } =
    useSeeking(duration, seek);

  const {
    trackRef,
    tooltipRef,
    hoverTime,
    hoverX,
    tooltipStyle,
    handleMouseMove,
    handleMouseLeave,
  } = useSliderTooltip({ isSeeking, duration, step, overlayRef });

  useEffect(() => {
    checkBuffering();
  }, [checkBuffering, currentTime]);

  useEffect(() => {
    if (isSeeking || shouldSkipSync(currentTime)) return;
    setValue(duration > 0 ? (currentTime / duration) * 100 : 0);
  }, [currentTime, duration, isSeeking, shouldSkipSync]);

  useEffect(() => {
    if (duration === 0) setValue(0);
  }, [duration]);

  const handleValueChange = (newValue: number) => {
    setIsSeeking(true);
    setValue(newValue);
    seekToSliderValue(newValue);
  };

  const handleValueCommitted = (newValue: number) => {
    setIsSeeking(false);
    seekToSliderValue(newValue);
  };

  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;
  const showTooltip =
    hoverTime !== null && !isNaN(hoverTime) && hoverX !== null && duration > 0;

  return (
    <div className="relative flex w-full">
      <SliderPrimitive.Root
        className={cn(
          'group relative inline-flex w-full cursor-pointer touch-none outline-hidden select-none',
        )}
        value={value}
        disabled={duration === 0}
        step={step}
        onValueChange={handleValueChange}
        onPointerDown={() => setIsSeeking(true)}
        onPointerUp={() => setIsSeeking(false)}
        onValueCommitted={handleValueCommitted}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <SliderPrimitive.Control
          className={cn(
            'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col',
            miniPlayer ? 'pt-2 pb-1' : 'pt-4 pb-1',
          )}
        >
          <SliderPrimitive.Track
            ref={trackRef}
            className={cn(
              'border-shadow bg-secondary relative w-full grow overflow-hidden rounded-full duration-100 group-hover:scale-y-150',
              miniPlayer ? 'h-0.5' : 'h-1',
            )}
          >
            <div
              className="bg-secondary-foreground/30 absolute h-full"
              style={{ width: `${bufferedPercent}%` }}
            />
            <SliderPrimitive.Indicator className="bg-primary absolute h-full" />
          </SliderPrimitive.Track>
          <div className="pointer-events-none absolute flex flex-col items-center opacity-0 transition-opacity duration-200 will-change-[left] data-visible:opacity-100" />
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className="bg-background pointer-events-none fixed z-50 -translate-x-1/2 rounded-md px-2 py-1 text-xs font-medium tabular-nums shadow-md"
          style={tooltipStyle}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
};

export default Time;
