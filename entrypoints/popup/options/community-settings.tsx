import MaterialSymbolsCoPresentRounded from '~icons/material-symbols/co-present-rounded';
import MaterialSymbolsDiversity3Rounded from '~icons/material-symbols/diversity-3-rounded';
import MaterialSymbolsGroups3Rounded from '~icons/material-symbols/groups-3-rounded';
import MaterialSymbolsNotificationsActiveRounded from '~icons/material-symbols/notifications-active-rounded';

import FeatureSwitch from '../_base/feature-switch';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';
import ActivitySettings from './activity-settings';
import UserOptions from './user-options';

const CommunitySettings = () => {
  const signedIn = useSettings((state) => Boolean(state.convexSession));

  return (
    <SettingsPage>
      {!signedIn && (
        <SettingsGroup footer="Для друзів, спільного перегляду й сповіщень.">
          <UserOptions />
        </SettingsGroup>
      )}

      <SettingsGroup title="Друзі">
        {signedIn && <ActivitySettings />}
        <FeatureSwitch
          feature="friendsActivity"
          option="hidden"
          inverted
          icon={<MaterialSymbolsDiversity3Rounded />}
          label="Активність друзів"
          description="Що друзі дивляться й читають"
        />
        {signedIn && (
          <FeatureSwitch
            feature="watchTogetherInvites"
            icon={<MaterialSymbolsCoPresentRounded />}
            label="Запрошення до перегляду"
            description="Коли друзі кличуть дивитися разом"
          />
        )}
      </SettingsGroup>

      <SettingsGroup title="Команди">
        {signedIn && (
          <FeatureSwitch
            feature="releaseNotifications"
            icon={<MaterialSymbolsNotificationsActiveRounded />}
            label="Нові серії"
            description="Від команд із пріоритету"
          />
        )}
        <FeatureSwitch
          feature="teamLinks"
          icon={<MaterialSymbolsGroups3Rounded />}
          label="Команди в меню й пошуку"
          description="У меню «Спільнота» й пошуку"
        />
      </SettingsGroup>
    </SettingsPage>
  );
};

export default CommunitySettings;
