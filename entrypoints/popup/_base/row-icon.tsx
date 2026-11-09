import type { FC, PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  /** Whether what the row controls is on; dims the tile when it's off. */
  active?: boolean;
}

/** The icon tile leading a settings row. */
const RowIcon: FC<Props> = ({ active = true, children }) => (
  <span
    aria-hidden="true"
    className={cn(
      'grid size-8 shrink-0 place-items-center rounded-lg transition-[background-color,color] duration-200 [&>svg]:size-4.5',
      active
        ? 'bg-primary/15 text-primary'
        : 'bg-muted/60 text-muted-foreground',
    )}
  >
    {children}
  </span>
);

export default RowIcon;
