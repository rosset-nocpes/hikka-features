import type { FC } from 'react';

import SwitchOption from '../_base/switch-option';

interface Props {
  grouped?: boolean;
}

const RecommendationBlockSettings: FC<Props> = ({ grouped }) => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.recommendationBlock;

  const handleClick = () => {
    updateFeatureSettings('recommendationBlock', { enabled: !enabled });
  };

  return (
    <SwitchOption
      grouped={grouped}
      checked={enabled}
      label="Блок рекомендацій"
      description="Блок із контентом, який схожий на той, який ви дивитеся"
      onClick={handleClick}
    />
  );
};

export default RecommendationBlockSettings;
