import SwitchOption from '../_base/switch-option';

const AniBackgroundSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.aniBackground;

  const handleClick = () => {
    updateFeatureSettings('aniBackground', { enabled: !enabled });
  };

  return (
    <SwitchOption
      checked={enabled}
      label="Обкладинки"
      description="Покращене оформлення на сторінках тайтлів, персонажів та правок"
      onClick={handleClick}
    />
  );
};

export default AniBackgroundSettings;
