import BaseSlider from './base-slider';

const Volume = () => {
  const { volume, changeVolume } = useIFramePlayer();

  // if (!canSetVolume) return null;

  return (
    <BaseSlider
      className="group mr-1 h-8 w-20 cursor-pointer touch-none outline-hidden select-none"
      value={volume * 100}
      onValueChange={(value) => {
        changeVolume((value as number) / 100);
      }}
    />
  );
};

export default Volume;
