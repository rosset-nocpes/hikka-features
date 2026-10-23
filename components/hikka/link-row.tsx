import type { FC, ReactNode } from 'react';

import MaterialSymbolsOpenInNewRounded from '~icons/material-symbols/open-in-new-rounded';

import { buttonVariants } from '@/components/ui/button';

interface Props {
  href: string;
  /** Goes in the 40px tile; sized by the caller to sit inset or fill it. */
  icon: ReactNode;
  label: ReactNode;
  /** A muted line under the label, e.g. where the link goes. */
  description?: ReactNode;
}

/** An outside link in the style of hikka.io's "Посилання" block. */
const LinkRow: FC<Props> = ({ href, icon, label, description }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      buttonVariants({ variant: 'ghost' }),
      'focus-visible:ring-ring/50 -mx-2 h-auto justify-start gap-3 p-2 text-left focus-visible:ring-[3px]',
    )}
  >
    <span className="border-border bg-secondary/40 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border">
      {icon}
    </span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-sm font-medium">{label}</span>
      {description && (
        <span className="text-muted-foreground truncate text-xs font-normal">
          {description}
        </span>
      )}
    </span>
    <MaterialSymbolsOpenInNewRounded className="text-muted-foreground opacity-0 group-hover/button:opacity-100 group-focus-visible/button:opacity-100" />
  </a>
);

export default LinkRow;
