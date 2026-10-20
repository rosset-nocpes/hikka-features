import type { FC } from 'react';

import MaterialSymbolsArrowRightAltRounded from '~icons/material-symbols/arrow-right-alt-rounded';

import { buttonVariants } from '../ui/button';

interface Props {
  href: string;
  disabled?: boolean;
}

/** The arrow link in a block's header, like the site's own blocks have. */
const BlockButton: FC<Props> = ({ href, disabled }) => (
  <a
    href={href}
    aria-disabled={disabled}
    className={cn(
      buttonVariants({ size: 'icon-sm', variant: 'ghost' }),
      'text-muted-foreground',
      disabled && 'pointer-events-none opacity-50',
    )}
  >
    <MaterialSymbolsArrowRightAltRounded className="text-sm" />
  </a>
);

export default BlockButton;
