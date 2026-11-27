import MaterialSymbolsFactCheckRounded from '~icons/material-symbols/fact-check-rounded';
import MaterialSymbolsPersonEditRounded from '~icons/material-symbols/person-edit-rounded';

import { GITHUB_REPO_URL } from '@/constants/links';
import { NEW_TAB } from '@/utils/hikka-router';

import FeatureSwitch from '../_base/feature-switch';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';

const EditingSettings = () => (
  <SettingsPage>
    <SettingsGroup
      footer={
        <>
          Щось не так?{' '}
          <a
            href={`${GITHUB_REPO_URL}/issues`}
            {...NEW_TAB}
            className="text-foreground decoration-foreground/40 hover:decoration-foreground underline underline-offset-2 transition-[text-decoration-color]"
          >
            Повідомте на GitHub
          </a>
        </>
      }
    >
      <FeatureSwitch
        feature="editorToolbar"
        icon={<MaterialSymbolsFactCheckRounded />}
        label="Панель редактора"
        description="Перевірка правил, джерело й перехід між правками"
        beta
      />
      <FeatureSwitch
        feature="editorCharacters"
        icon={<MaterialSymbolsPersonEditRounded />}
        label="Переклад імен"
        description="Пропонує ім’я персонажа українською"
        beta
      />
    </SettingsGroup>
  </SettingsPage>
);

export default EditingSettings;
