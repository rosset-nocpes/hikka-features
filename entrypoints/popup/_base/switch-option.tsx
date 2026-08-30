import type { FC, PropsWithChildren } from 'react';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface Props extends PropsWithChildren {
  label: string;
  beta?: boolean;
  description?: string;
  checked: boolean;
  onClick?: () => void;
  grouped?: boolean;
}

const SwitchOption: FC<Props> = ({
  label,
  description,
  checked,
  onClick,
  beta = false,
  grouped = false,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        grouped &&
          'hover:bg-accent/30 cursor-pointer px-4 py-3 transition-[background-color]',
      )}
      onClick={grouped ? onClick : undefined}
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
        onClick={grouped ? (event) => event.stopPropagation() : undefined}
        onCheckedChange={() => onClick?.()}
        className="flex items-center justify-between transition-[background-color,box-shadow] after:-inset-y-3"
      />
    </div>
  );
};

export default SwitchOption;
