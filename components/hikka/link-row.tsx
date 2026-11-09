import type { FC, ReactNode } from 'react';

import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';
import MaterialSymbolsOpenInNewRounded from '~icons/material-symbols/open-in-new-rounded';

import { buttonVariants } from '@/components/ui/button';
import { onHikkaLinkClick } from '@/utils/hikka-router';

interface Props {
  /** An outside address, opened in a new tab. */
  href?: string;
  /** A hikka.io path, opened in place. Without either the row is no link. */
  to?: string;
  /** Goes in the 40px tile; sized by the caller to sit inset or fill it. */
  icon: ReactNode;
  label: ReactNode;
  /** A muted line under the label, e.g. where the link goes. */
  description?: ReactNode;
}

const ROW = '-mx-2 h-auto justify-start gap-3 p-2 text-left';

/** A row in the style of hikka.io's "Посилання" block. */
const LinkRow: FC<Props> = ({ href, to, icon, label, description }) => {
  const content = (
    <>
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
    </>
  );

  if (!href && !to) {
    return (
      <div className={cn(buttonVariants({ variant: null }), ROW)}>
        {content}
      </div>
    );
  }

  const Icon = to
    ? MaterialSymbolsChevronRightRounded
    : MaterialSymbolsOpenInNewRounded;
  return (
    <a
      href={to ?? href}
      {...(to
        ? { onClick: onHikkaLinkClick }
        : { target: '_blank', rel: 'noopener noreferrer' })}
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        ROW,
      )}
    >
      {content}
      <Icon className="text-muted-foreground opacity-0 group-hover/button:opacity-100 group-focus-visible/button:opacity-100" />
    </a>
  );
};

export default LinkRow;
