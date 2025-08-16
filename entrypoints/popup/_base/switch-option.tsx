import type { FC, PropsWithChildren } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Props extends PropsWithChildren {
  label: string;
  description?: string;
  checked: boolean;
  onClick?: () => void;
}

const SwitchOption: FC<Props> = ({ label, description, checked, onClick }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="mr-10 flex flex-col gap-1">
        <Label>{label}</Label>
        {description && (
          <p className="font-medium text-[#A1A1A1] text-xs">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onClick={onClick}
        className="flex items-center justify-between"
      />
    </div>
  );
};

export default SwitchOption;
