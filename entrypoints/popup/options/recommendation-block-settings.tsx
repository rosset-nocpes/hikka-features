import SwitchOption from '../_base/switch-option';

const RecommendationBlockSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.recommendationBlock;

  const handleClick = () => {
    updateFeatureSettings('recommendationBlock', { enabled: !enabled });
  };

  return (
    <SwitchOption
      checked={enabled}
      label="Блок рекомендацій"
      description="Блок із контентом, який схожий на той, який ви дивитеся"
      onClick={handleClick}
    />
  );
};

export default RecommendationBlockSettings;
