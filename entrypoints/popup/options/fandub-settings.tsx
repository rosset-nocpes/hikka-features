import SwitchOption from '../_base/switch-option';

const FandubSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.fandubBlock;

  const handleClick = () => {
    updateFeatureSettings('fandubBlock', { enabled: !enabled });
  };

  return (
    <SwitchOption
      checked={enabled}
      label="Блок фандаб команд"
      description="Посилання на фандаб команди, які озвучили аніме тайтл"
      onClick={handleClick}
    />
  );
};

export default FandubSettings;
