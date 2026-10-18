import BaseSlider from './base-slider';

const Volume = () => {
  const { volume, isMuted, changeVolume } = useIFramePlayer();

  return (
    <BaseSlider
      aria-label="Гучність"
      className="group h-8 w-full cursor-pointer touch-none outline-hidden select-none"
      value={isMuted ? 0 : volume * 100}
      onValueChange={(value) => {
        changeVolume((value as number) / 100);
      }}
    />
  );
};

export default Volume;
