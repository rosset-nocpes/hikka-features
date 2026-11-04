import type { FC, PropsWithChildren } from 'react';

/** The muted line under a settings row's label. */
const RowDescription: FC<PropsWithChildren> = ({ children }) => (
  <span className="text-muted-foreground text-xs leading-snug font-normal text-pretty">
    {children}
  </span>
);

export default RowDescription;
