import type { FC, ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';

import RowDescription from './row-description';

interface Props {
  label: ReactNode;
  description?: ReactNode;
  beta?: boolean;
  /** For the label, so a control can be named by it. */
  id?: string;
  /** For the description, so a control can be described by it. */
  descriptionId?: string;
  /** Fades the label, as for a control that can't be used now. */
  dimmed?: boolean;
}

/** A settings row's label with its description under it. */
const RowLabel: FC<Props> = ({
  label,
  description,
  beta,
  id,
  descriptionId,
  dimmed,
}) => (
  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
    <span
      id={id}
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium transition-opacity duration-200',
        dimmed && 'opacity-50',
      )}
    >
      {label}
      {beta && (
        <Badge className="bg-warning/15 text-warning h-4 rounded-sm px-1 text-[10px] font-semibold tracking-wide uppercase">
          Beta
        </Badge>
      )}
    </span>
    {description && (
      <span id={descriptionId} className="flex flex-col">
        {typeof description === 'string' ? (
          <RowDescription>{description}</RowDescription>
        ) : (
          description
        )}
      </span>
    )}
  </span>
);

export default RowLabel;
