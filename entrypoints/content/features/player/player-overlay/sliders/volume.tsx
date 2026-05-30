import BaseSlider from './base-slider';

const Volume = () => {
  const { volume, changeVolume } = useIFramePlayer();

  // if (!canSetVolume) return null;

  return (
    <BaseSlider
      className="group mr-1 h-8 w-[80px] cursor-pointer touch-none select-none outline-hidden"
      value={[volume * 100]}
      onValueChange={([value]) => {
        changeVolume(value / 100);
      }}
    />
  );
};

export default Volume;
