import type { FC, ReactNode } from 'react';

import { Switch } from '@/components/ui/switch';

import RowIcon from './row-icon';
import RowLabel from './row-label';

interface Props {
  label: string;
  beta?: boolean;
  description?: ReactNode;
  icon?: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/** A settings row that toggles when clicked anywhere. */
const SwitchOption: FC<Props> = ({
  label,
  description,
  icon,
  checked,
  disabled,
  onClick,
  beta = false,
}) => (
  <div
    className={cn(
      'flex min-h-14 items-center gap-3 px-4 py-3 transition-[background-color]',
      disabled ? 'cursor-progress' : 'hover:bg-accent/40 cursor-pointer',
    )}
    onClick={disabled ? undefined : onClick}
  >
    {icon && <RowIcon active={checked}>{icon}</RowIcon>}
    <RowLabel label={label} description={description} beta={beta} />
    <Switch
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={() => onClick?.()}
      className="ml-1 after:-inset-y-3"
    />
  </div>
);

export default SwitchOption;
