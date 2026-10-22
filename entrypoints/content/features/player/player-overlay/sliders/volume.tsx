import { Slider as SliderPrimitive } from '@base-ui/react/slider';

const Volume = () => {
  const { volume, isMuted, changeVolume } = useIFramePlayer();

  return (
    <SliderPrimitive.Root
      aria-label="Гучність"
      className="relative flex w-full touch-none items-center select-none"
      value={isMuted ? 0 : volume * 100}
      onValueChange={(value) => changeVolume((value as number) / 100)}
    >
      <SliderPrimitive.Control className="group relative flex h-8 w-full cursor-pointer touch-none items-center outline-hidden select-none data-disabled:opacity-50">
        <SliderPrimitive.Track className="bg-secondary relative h-1 w-full grow overflow-hidden rounded-full duration-100 group-hover:scale-y-150">
          <SliderPrimitive.Indicator className="bg-primary absolute h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
};

export default Volume;
