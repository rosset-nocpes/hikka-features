import type { FC } from 'react';

import SwitchOption from '../_base/switch-option';

interface Props {
  grouped?: boolean;
}

const AniButtonsSettings: FC<Props> = ({ grouped }) => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.aniButtons;

  const handleClick = () => {
    updateFeatureSettings('aniButtons', { enabled: !enabled });
  };

  return (
    <SwitchOption
      grouped={grouped}
      label="Інші джерела"
      description="Додаткові посилання на сторінках тайтлів"
      checked={enabled}
      onClick={handleClick}
    />
  );
};

export default AniButtonsSettings;
