import type { FC, ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';

import RowDescription from './row-description';

interface Props {
  label: ReactNode;
  description?: ReactNode;
  beta?: boolean;
  id?: string;
}

/** A settings row's label with its description under it. */
const RowLabel: FC<Props> = ({ label, description, beta, id }) => (
  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
    <span id={id} className="flex items-center gap-1.5 text-sm font-medium">
      {label}
      {beta && (
        <Badge className="bg-warning/15 text-warning h-4 rounded-sm px-1 text-[10px] font-semibold tracking-wide uppercase">
          Beta
        </Badge>
      )}
    </span>
    {description &&
      (typeof description === 'string' ? (
        <RowDescription>{description}</RowDescription>
      ) : (
        description
      ))}
  </span>
);

export default RowLabel;
