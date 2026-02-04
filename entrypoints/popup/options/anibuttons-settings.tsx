import SwitchOption from '../_base/switch-option';

const AniButtonsSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.aniButtons;

  const handleClick = () => {
    updateFeatureSettings('aniButtons', { enabled: !enabled });
  };

  return (
    <SwitchOption
      label="Інші джерела"
      description="Додаткові посилання на сторінках тайтлів"
      checked={enabled}
      onClick={handleClick}
    />
  );
};

export default AniButtonsSettings;
