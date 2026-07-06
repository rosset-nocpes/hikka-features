import type { FC, PropsWithChildren } from 'react';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
        <Label className="flex cursor-pointer gap-1">
          {label}
          {beta && (
            <Badge
              variant="outline"
              className="text-primary-foreground bg-yellow-500 px-2 py-0"
            >
              Beta
            </Badge>
          )}
        </Label>
        {description && (
          <p className="text-xs font-medium text-pretty text-[#A1A1A1]">
            {description}
          </p>
        )}
      </div>
      <Switch
        checked={checked}
        onClick={grouped ? undefined : onClick}
        className={cn(
          'flex items-center justify-between',
          grouped && 'pointer-events-none',
        )}
      />
    </div>
  );
};

export default SwitchOption;
