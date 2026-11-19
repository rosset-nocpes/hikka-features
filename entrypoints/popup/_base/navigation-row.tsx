import type { ReactNode } from 'react';

import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';

import RowIcon from './row-icon';
import RowLabel from './row-label';

interface Props {
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** Whether the feature behind the page is on; tints the icon. */
  active?: boolean;
  onClick: () => void;
}

const NavigationRow = ({
  label,
  description,
  icon,
  active,
  onClick,
}: Props) => (
  <button
    type="button"
    onClick={onClick}
    className="group/row hover:bg-accent/40 focus-visible:bg-accent/40 flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-[background-color] outline-none"
  >
    {icon && <RowIcon active={active}>{icon}</RowIcon>}
    <RowLabel label={label} description={description} />
    <MaterialSymbolsChevronRightRounded className="text-muted-foreground ml-1 size-5 shrink-0 transition-transform group-hover/row:translate-x-0.5" />
  </button>
);

export default NavigationRow;
