import FeatureSwitch from '../_base/feature-switch';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';

const LocalizedPosterSettings = () => (
  <SettingsPage>
    <SettingsGroup>
      <FeatureSwitch
        feature="localizedPoster"
        label="Кнопка локалізації постера"
      />
      <FeatureSwitch
        feature="localizedPoster"
        option="autoShow"
        label="Автолокалізація постера"
        description="Автоматично замінює постер локалізованою версією"
      />
    </SettingsGroup>
  </SettingsPage>
);

export default LocalizedPosterSettings;
