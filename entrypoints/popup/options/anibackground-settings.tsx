import type { FC } from 'react';

import SwitchOption from '../_base/switch-option';

interface Props {
  grouped?: boolean;
}

const AniBackgroundSettings: FC<Props> = ({ grouped }) => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.aniBackground;

  const handleClick = () => {
    updateFeatureSettings('aniBackground', { enabled: !enabled });
  };

  return (
    <SwitchOption
      grouped={grouped}
      checked={enabled}
      label="Обкладинки"
      description="Покращене оформлення на сторінках тайтлів, персонажів та правок"
      onClick={handleClick}
    />
  );
};

export default AniBackgroundSettings;
