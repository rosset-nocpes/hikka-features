import MaterialSymbolsCodeRounded from '~icons/material-symbols/code-rounded';
import MaterialSymbolsPetsRounded from '~icons/material-symbols/pets-rounded';

import FeatureSwitch from '../_base/feature-switch';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';

const ExperimentalSettingsPage = () => (
  <SettingsPage>
    <SettingsGroup footer="Щоб сховати цю сторінку, ще раз натисніть п’ять разів на версію.">
      <FeatureSwitch
        feature="devOptions"
        option="burunyaaMode"
        icon={<MaterialSymbolsPetsRounded />}
        label="Burunyaa режим"
      />
      <FeatureSwitch
        feature="devOptions"
        option="devTools"
        icon={<MaterialSymbolsCodeRounded />}
        label="Режим розробника"
        description="Додає функції, які полегшують роботу з розширенням"
      />
    </SettingsGroup>
  </SettingsPage>
);

export default ExperimentalSettingsPage;
