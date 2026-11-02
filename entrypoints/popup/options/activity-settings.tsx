import { useActivitySharing } from '@/hooks/use-activity-sharing';

import SwitchOption from '../_base/switch-option';

/** Kept in the account, so it holds on every device the user signs in on. */
const ActivitySettings = () => {
  const { shared, pending, setShared } = useActivitySharing();

  return (
    <SwitchOption
      checked={shared ?? false}
      label="Ділитися активністю"
      description="Друзі, з якими ви взаємно підписані, бачать, що ви дивитеся й читаєте в розширенні"
      onClick={() => {
        if (shared !== undefined && !pending) setShared(!shared);
      }}
    />
  );
};

export default ActivitySettings;
