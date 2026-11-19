import type { FC } from 'react';

import { Switch } from '@/components/ui/switch';

import SettingRow from './setting-row';

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/** A settings row that toggles when clicked anywhere. */
const SwitchOption: FC<Props> = ({
  label,
  description,
  checked,
  onCheckedChange,
}) => (
  <SettingRow
    label={label}
    description={description}
    onClick={() => onCheckedChange?.(!checked)}
  >
    <Switch
      checked={checked}
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={onCheckedChange}
      className="after:-inset-y-3"
    />
  </SettingRow>
);

export default SwitchOption;
