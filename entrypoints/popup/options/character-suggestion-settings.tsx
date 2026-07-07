import type { FC } from 'react';

import SwitchOption from '../_base/switch-option';

interface Props {
  grouped?: boolean;
}

const CharacterSuggestionsSettings: FC<Props> = ({ grouped }) => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.editorCharacters;

  const handleClick = () => {
    updateFeatureSettings('editorCharacters', { enabled: !enabled });
  };

  return (
    <SwitchOption
      grouped={grouped}
      label="Пропозиції перекладу імен"
      description="Показує переклад імені українською при редагуванні персонажа"
      beta
      checked={enabled}
      onClick={handleClick}
    />
  );
};

export default CharacterSuggestionsSettings;
