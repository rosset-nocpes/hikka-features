import FeatureSwitch from '../_base/feature-switch';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';

const ReaderSettings = () => (
  <SettingsPage>
    <SettingsGroup>
      <FeatureSwitch
        feature="reader"
        label="Кнопка читалки"
        description="Кнопка для відображення читалки"
      />
    </SettingsGroup>
  </SettingsPage>
);

export default ReaderSettings;
