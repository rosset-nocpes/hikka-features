import type { FC } from 'react';

import SwitchOption from '../_base/switch-option';

interface Props {
  grouped?: boolean;
}

const FandubSettings: FC<Props> = ({ grouped }) => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.fandubBlock;

  const handleClick = () => {
    updateFeatureSettings('fandubBlock', { enabled: !enabled });
  };

  return (
    <SwitchOption
      grouped={grouped}
      checked={enabled}
      label="Блок фандаб команд"
      description="Посилання на фандаб команди, які озвучили аніме тайтл"
      onClick={handleClick}
    />
  );
};

export default FandubSettings;
