import type { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface Props {
  label: string;
  beta?: boolean;
  description?: string;
  checked: boolean;
  onClick?: () => void;
}

/** A settings row that toggles when clicked anywhere. */
const SwitchOption: FC<Props> = ({
  label,
  description,
  checked,
  onClick,
  beta = false,
}) => (
  <div
    className="hover:bg-accent/30 flex cursor-pointer items-center justify-between px-4 py-3 transition-[background-color]"
    onClick={onClick}
  >
    <div className="mr-10 flex flex-col gap-1">
      <span className="flex items-center gap-1 text-sm leading-none font-medium">
        {label}
        {beta && (
          <Badge
            variant="outline"
            className="text-primary-foreground bg-yellow-500 px-2 py-0"
          >
            Beta
          </Badge>
        )}
      </span>
      {description && (
        <p className="text-xs font-medium text-pretty text-[#A1A1A1]">
          {description}
        </p>
      )}
    </div>
    <Switch
      checked={checked}
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={() => onClick?.()}
      className="flex items-center justify-between transition-[background-color,box-shadow] after:-inset-y-3"
    />
  </div>
);

export default SwitchOption;
