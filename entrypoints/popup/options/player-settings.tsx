import { useNavigation } from '@/hooks/use-navigation';

import FeatureSwitch from '../_base/feature-switch';
import NavigationRow from '../_base/navigation-row';
import SelectOption from '../_base/select-option';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';

const MINI_MODE_OPTIONS = [
  { value: 'custom', label: 'Кастомний' },
  { value: 'video-native', label: 'Нативний' },
] as const;

const PROVIDER_OPTIONS = ['moon', 'ashdi'].map((value) => ({
  value,
  label: value.toUpperCase(),
}));

const PlayerSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const {
    defaultProvider,
    miniModeType,
    teamPriority,
    teamPriorityTranslation,
  } = features.player;
  const { navigate } = useNavigation();

  return (
    <SettingsPage>
      <SettingsGroup>
        <FeatureSwitch
          feature="player"
          label="Кнопка перегляду"
          description="Кнопка для відображення програвача"
        />
        <FeatureSwitch
          feature="player"
          option="disableBlur"
          label="Вимкнути блюр"
          description="Прибирає розмиття фону в програвачі"
        />
        <SelectOption
          label="Тип мінірежиму"
          value={miniModeType}
          options={[...MINI_MODE_OPTIONS]}
          onChange={(value) =>
            updateFeatureSettings('player', { miniModeType: value })
          }
          width="w-36"
        />
        <SelectOption
          label="Програвач за замовчуванням"
          value={defaultProvider}
          options={PROVIDER_OPTIONS}
          onChange={(value) =>
            updateFeatureSettings('player', { defaultProvider: value })
          }
          width="w-24"
        />
        <NavigationRow
          label="Пріоритет команд"
          description={
            teamPriority.length
              ? `${teamPriorityTranslation === 'sub' ? 'Субтитри' : 'Озвучення'} · ${teamPriority.map((team) => team.title).join(', ')}`
              : 'Яку команду обирати під час відкриття програвача'
          }
          onClick={() => navigate('teamPriority')}
        />
      </SettingsGroup>
    </SettingsPage>
  );
};

export default PlayerSettings;
