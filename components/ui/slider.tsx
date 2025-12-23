import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import * as React from 'react';

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      className="data-vertical:h-full data-horizontal:w-full"
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control
        className={cn(
          'relative flex w-full touch-none select-none items-center data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col data-disabled:opacity-50',
          className,
        )}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative select-none overflow-hidden rounded-full bg-muted data-horizontal:h-1.5 data-vertical:h-full data-horizontal:w-full data-vertical:w-1.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="select-none bg-primary data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="block size-4 shrink-0 select-none rounded-full border border-primary bg-white shadow-xs ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:outline-hidden focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
