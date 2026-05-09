import { Slider as SliderPrimitive } from 'radix-ui';
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
    {children}
  </SliderPrimitive.Root>
));

export default BaseSlider;
