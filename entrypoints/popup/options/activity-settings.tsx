import MaterialSymbolsGroupRounded from '~icons/material-symbols/group-rounded';

import { useActivitySharing } from '@/hooks/use-activity-sharing';

import SwitchOption from '../_base/switch-option';

/** Kept in the account, so it holds on every device the user signs in on. */
const ActivitySettings = () => {
  const { shared, pending, error, setShared } = useActivitySharing();

  return (
    <SwitchOption
      checked={shared ?? false}
      disabled={shared === undefined}
      icon={<MaterialSymbolsGroupRounded />}
      label="Ділитися активністю"
      description={
        error ? (
          <span role="alert" className="text-destructive text-xs leading-snug">
            Не вдалося завантажити налаштування
          </span>
        ) : (
          'Взаємні друзі бачать, що ви дивитеся й читаєте'
        )
      }
      onClick={() => {
        if (!pending) setShared(!shared);
      }}
    />
  );
};

export default ActivitySettings;
