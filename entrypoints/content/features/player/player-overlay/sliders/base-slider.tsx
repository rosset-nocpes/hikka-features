import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { forwardRef } from 'react';

const BaseSlider = forwardRef<
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
    className="relative flex w-full touch-none items-center select-none"
    {...props}
  >
    <SliderPrimitive.Control
      className={cn(
        'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col',
        className,
      )}
    >
      <SliderPrimitive.Track className="bg-secondary relative h-1 w-full grow overflow-hidden rounded-full duration-100 group-hover:scale-y-150">
        {bufferSegments?.map((segment, index) => (
          <div
            key={index}
            className="bg-secondary-foreground/30 absolute h-full"
            style={{
              left: `${segment.start}%`,
              width: `${segment.end - segment.start}%`,
            }}
          />
        ))}
        <SliderPrimitive.Indicator className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb />
      {children}
    </SliderPrimitive.Control>
  </SliderPrimitive.Root>
));

export default BaseSlider;
