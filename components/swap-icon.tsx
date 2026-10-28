import type { FC, ReactNode } from 'react';

const SHOWN = 'blur-0 scale-100 opacity-100';
const HIDDEN = 'scale-[0.25] opacity-0 blur-xs';
// Under reduced motion only the opacity changes.
const FADE =
  'transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-[opacity,filter,scale] motion-reduce:scale-100 motion-reduce:blur-none';

interface Props {
  /** Shows `on` instead of `off`. */
  active: boolean;
  on: ReactNode;
  off: ReactNode;
  className?: string;
}

/** Two icons in one place, crossfading as `active` changes. */
const SwapIcon: FC<Props> = ({ active, on, off, className }) => (
  <span className={cn('relative inline-flex', className)}>
    <span
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        FADE,
        active ? SHOWN : HIDDEN,
      )}
    >
      {on}
    </span>
    <span
      className={cn(
        'flex size-full items-center justify-center',
        FADE,
        active ? HIDDEN : SHOWN,
      )}
    >
      {off}
    </span>
  </span>
);

export default SwapIcon;
