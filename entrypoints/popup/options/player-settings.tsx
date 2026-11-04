import { useNavigation } from '@/hooks/use-navigation';

import FeatureSwitch from '../_base/feature-switch';
import NavigationRow from '../_base/navigation-row';
import RowDescription from '../_base/row-description';
import SegmentedOption from '../_base/segmented-option';
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
          description="Відкриває програвач на сторінці аніме"
        />
      </SettingsGroup>

      <SettingsGroup title="Джерело">
        <SegmentedOption
          label="Програвач"
          description="Відкривається першим"
          value={defaultProvider}
          options={PROVIDER_OPTIONS}
          onChange={(value) =>
            updateFeatureSettings('player', { defaultProvider: value })
          }
        />
        <NavigationRow
          label="Пріоритет команд"
          description={
            teamPriority.length ? (
              <RowDescription>
                <span className="line-clamp-2">
                  {teamPriorityTranslation === 'sub' ? 'Субтитри' : 'Озвучення'}
                  {' · '}
                  {teamPriority.map((team) => team.title).join(', ')}
                </span>
              </RowDescription>
            ) : (
              'Яку команду обирати під час відкриття програвача'
            )
          }
          onClick={() => navigate('teamPriority')}
        />
      </SettingsGroup>

      <SettingsGroup title="Відтворення">
        <FeatureSwitch
          feature="player"
          option="autoplayNext"
          label="Автопрогравання"
          description="Наступний епізод із черги вмикається сам, коли поточний закінчиться"
        />
        <FeatureSwitch
          feature="player"
          option="disableBlur"
          label="Вимкнути блюр"
          description="Прибирає розмиття фону в програвачі"
        />
        <SegmentedOption
          label="Мінірежим"
          value={miniModeType}
          options={MINI_MODE_OPTIONS}
          onChange={(value) =>
            updateFeatureSettings('player', { miniModeType: value })
          }
        />
      </SettingsGroup>
    </SettingsPage>
  );
};

export default PlayerSettings;
