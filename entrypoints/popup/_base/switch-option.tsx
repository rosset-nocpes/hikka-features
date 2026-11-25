import { type FC, type ReactNode, useId } from 'react';

import { Switch } from '@/components/ui/switch';

import RowIcon from './row-icon';
import RowLabel from './row-label';

interface Props {
  label: string;
  beta?: boolean;
  description?: ReactNode;
  icon?: ReactNode;
  checked: boolean;
  /**
   * Can't be changed now, e.g. while what it depends on is off. The
   * description, which says why, stays readable.
   */
  disabled?: boolean;
  /** Its value is loading or saving; it can't be changed until it is. */
  pending?: boolean;
  onClick?: () => void;
}

/** A settings row that toggles when clicked anywhere. */
const SwitchOption: FC<Props> = ({
  label,
  description,
  icon,
  checked,
  disabled,
  pending,
  onClick,
  beta = false,
}) => {
  const id = useId();
  const descriptionId = useId();
  const locked = disabled || pending;

  return (
    <div
      className={cn(
        'flex min-h-14 items-center gap-3 px-4 py-3 transition-[background-color]',
        pending && 'cursor-progress',
        disabled && 'cursor-not-allowed',
        !locked && 'hover:bg-accent/40 cursor-pointer',
      )}
      onClick={locked ? undefined : onClick}
    >
      {icon && <RowIcon active={checked && !disabled}>{icon}</RowIcon>}
      <RowLabel
        id={id}
        descriptionId={description ? descriptionId : undefined}
        label={label}
        description={description}
        beta={beta}
        dimmed={disabled}
      />
      <Switch
        checked={checked}
        disabled={locked}
        aria-labelledby={id}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
        onCheckedChange={() => onClick?.()}
        // Pending, it keeps its look: the value it shows is already the new one.
        className={cn(
          'ml-1 after:-inset-y-3',
          pending && !disabled && 'data-disabled:opacity-100',
        )}
      />
    </div>
  );
};

export default SwitchOption;
