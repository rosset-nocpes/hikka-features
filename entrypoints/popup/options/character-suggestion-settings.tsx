import SwitchOption from '../_base/switch-option';

const CharacterSuggestionsSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.editorCharacters;

  const handleClick = () => {
    updateFeatureSettings('editorCharacters', { enabled: !enabled });
  };

  return (
    <SwitchOption
      label="Пропозиції перекладу імен"
      description="Показує переклад імені українською при редагуванні персонажа"
      beta
      checked={enabled}
      onClick={handleClick}
    />
  );
};

export default CharacterSuggestionsSettings;
