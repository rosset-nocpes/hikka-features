import type { FC, PropsWithChildren } from 'react';

/** The muted line under a settings row's label. */
const RowDescription: FC<PropsWithChildren> = ({ children }) => (
  <span className="text-xs font-medium text-pretty text-[#A1A1A1]">
    {children}
  </span>
);

export default RowDescription;
