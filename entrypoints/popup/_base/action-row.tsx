import type { FC, ReactNode } from 'react';

import RowIcon from './row-icon';
import RowLabel from './row-label';

interface Props {
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** The row's button(s), at its end. */
  children: ReactNode;
}

/** A settings row that does something rather than holding a value. */
const ActionRow: FC<Props> = ({ label, description, icon, children }) => (
  <div className="flex min-h-14 items-center gap-3 px-4 py-3">
    {icon && <RowIcon active={false}>{icon}</RowIcon>}
    <RowLabel label={label} description={description} />
    {children}
  </div>
);

export default ActionRow;
