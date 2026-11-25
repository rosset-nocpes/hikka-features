import type { FC, PropsWithChildren, ReactNode } from 'react';

interface Props extends PropsWithChildren {
  label: string;
  description?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/** A row of the reader settings, styled like the popup's settings rows. */
const SettingRow: FC<Props> = ({
  label,
  description,
  onClick,
  className,
  children,
}) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 px-4 py-3',
      onClick &&
        'hover:bg-accent/30 cursor-pointer transition-[background-color]',
      className,
    )}
    onClick={onClick}
  >
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm leading-none font-medium">{label}</span>
      {description && (
        <span className="text-xs font-medium text-pretty text-[#A1A1A1]">
          {description}
        </span>
      )}
    </div>
    {children}
  </div>
);

export default SettingRow;
