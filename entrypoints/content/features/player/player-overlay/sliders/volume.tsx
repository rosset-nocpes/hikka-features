import { Slider as SliderPrimitive } from '@base-ui/react/slider';

interface VolumeSliderProps {
  /** 0 to 1. */
  volume: number;
  onChange: (volume: number) => void;
  className?: string;
}

/** A volume slider for any player. */
export const VolumeSlider = ({
  volume,
  onChange,
  className,
}: VolumeSliderProps) => (
  <SliderPrimitive.Root
    aria-label="Гучність"
    className={cn(
      'relative flex w-full touch-none items-center select-none',
      className,
    )}
    value={volume * 100}
    onValueChange={(value) => onChange((value as number) / 100)}
  >
    <SliderPrimitive.Control className="group relative flex h-8 w-full cursor-pointer touch-none items-center outline-hidden select-none data-disabled:opacity-50">
      <SliderPrimitive.Track className="bg-secondary relative h-1 w-full grow overflow-hidden rounded-full transition-transform duration-100 motion-safe:group-hover:scale-y-150">
        <SliderPrimitive.Indicator className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb />
    </SliderPrimitive.Control>
  </SliderPrimitive.Root>
);

/** The video's volume. */
const Volume = () => {
  const { volume, isMuted, changeVolume } = useIFramePlayer();
  return <VolumeSlider volume={isMuted ? 0 : volume} onChange={changeVolume} />;
};

export default Volume;
