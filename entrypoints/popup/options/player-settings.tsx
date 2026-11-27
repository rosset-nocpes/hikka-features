import MaterialSymbolsAutoplayRounded from '~icons/material-symbols/autoplay-rounded';
import MaterialSymbolsBlurOnRounded from '~icons/material-symbols/blur-on-rounded';
import MaterialSymbolsFastForwardRounded from '~icons/material-symbols/fast-forward-rounded';
import MaterialSymbolsFormatListNumberedRounded from '~icons/material-symbols/format-list-numbered-rounded';
import MaterialSymbolsPictureInPictureAltRounded from '~icons/material-symbols/picture-in-picture-alt-rounded';
import MaterialSymbolsPlayCircleRounded from '~icons/material-symbols/play-circle-rounded';
import MaterialSymbolsSmartDisplayRounded from '~icons/material-symbols/smart-display-rounded';

import { PROVIDERS } from '@/constants/providers';
import { useNavigation } from '@/hooks/use-navigation';

import FeatureSwitch from '../_base/feature-switch';
import NavigationRow from '../_base/navigation-row';
import RowDescription from '../_base/row-description';
import SegmentedOption from '../_base/segmented-option';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';

const MINI_MODE_OPTIONS = [
  { value: 'custom', label: 'На сторінці' },
  { value: 'video-native', label: 'Картинка в картинці' },
] as const;

const SKIP_OPTIONS = [
  { value: 'off', label: 'Вимк.' },
  { value: 'button', label: 'Кнопкою' },
  { value: 'auto', label: 'Авто' },
] as const;

const PROVIDER_OPTIONS = PROVIDERS.map((value) => ({
  value,
  label: value[0]!.toUpperCase() + value.slice(1),
}));

const PlayerSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const {
    enabled,
    defaultProvider,
    miniModeType,
    skipSegments,
    teamPriority,
    teamPriorityTranslation,
  } = features.player;
  const { navigate } = useNavigation();

  return (
    <SettingsPage>
      <SettingsGroup
        footer={enabled ? undefined : 'Діють, коли кнопку увімкнено.'}
      >
        <FeatureSwitch
          feature="player"
          icon={<MaterialSymbolsPlayCircleRounded />}
          label="Кнопка перегляду"
          description="Відкриває програвач на сторінці аніме"
        />
      </SettingsGroup>

      <SettingsGroup title="Джерело">
        <SegmentedOption
          icon={<MaterialSymbolsSmartDisplayRounded />}
          stacked
          label="Типове джерело"
          description="Коли серія є в кількох джерелах"
          value={defaultProvider}
          options={PROVIDER_OPTIONS}
          onChange={(value) =>
            updateFeatureSettings('player', { defaultProvider: value })
          }
        />
        <NavigationRow
          icon={<MaterialSymbolsFormatListNumberedRounded />}
          active={teamPriority.length > 0}
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
              'Яку команду відкривати першою'
            )
          }
          onClick={() => navigate('teamPriority')}
        />
      </SettingsGroup>

      <SettingsGroup title="Відтворення">
        <FeatureSwitch
          feature="player"
          option="autoplayNext"
          icon={<MaterialSymbolsAutoplayRounded />}
          label="Автопрогравання"
          description="Наступна серія вмикається сама"
        />
        <SegmentedOption
          icon={<MaterialSymbolsFastForwardRounded />}
          active={skipSegments !== 'off'}
          stacked
          label="Пропуск заставок"
          description="Опенінґи, ендінґи й рекапи"
          value={skipSegments}
          options={SKIP_OPTIONS}
          onChange={(value) =>
            updateFeatureSettings('player', { skipSegments: value })
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Вигляд">
        <SegmentedOption
          icon={<MaterialSymbolsPictureInPictureAltRounded />}
          stacked
          label="Мінірежим"
          description="Куди згортається програвач"
          value={miniModeType}
          options={MINI_MODE_OPTIONS}
          onChange={(value) =>
            updateFeatureSettings('player', { miniModeType: value })
          }
        />
        <FeatureSwitch
          feature="player"
          option="disableBlur"
          inverted
          icon={<MaterialSymbolsBlurOnRounded />}
          label="Розмиття фону"
          description="Вимкніть, якщо програвач гальмує"
        />
      </SettingsGroup>
    </SettingsPage>
  );
};

export default PlayerSettings;
