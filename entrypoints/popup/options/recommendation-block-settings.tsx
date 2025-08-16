import { useEffect, useState } from 'react';
import SwitchOption from '../_base/switch-option';

const RecommendationBlockSettings = () => {
  const [showRecommendationBlock, toggleRecommendationBlock] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    recommendationBlockState.getValue().then((showRecommendationBlock) => {
      toggleRecommendationBlock(showRecommendationBlock);
    });
  }, []);

  const handleClick = () => {
    recommendationBlockState.setValue(!showRecommendationBlock);
    toggleRecommendationBlock(!showRecommendationBlock);
  };

  return (
    <SwitchOption
      checked={showRecommendationBlock!}
      label="Блок рекомендацій"
      description="Блок із контентом, який схожий на той, який ви дивитеся"
      onClick={handleClick}
    />
  );
};

export default RecommendationBlockSettings;
