import type { FC, ReactNode } from 'react';

import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';

import { onHikkaLinkClick } from '@/utils/hikka-router';

interface Props {
  title: ReactNode;
  /** An outside address, opened in a new tab. */
  href?: string;
  /** A hikka.io path, opened in place. */
  to?: string;
  disabled?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const BlockHeader: FC<Props> = ({
  title,
  href,
  to,
  disabled,
  icon,
  children,
}) => {
  return (
    <div className="flex min-h-8 items-center gap-3">
      <h2 className="flex w-full min-w-0 items-center justify-between gap-2 text-lg leading-7 font-bold">
        {(href || to) && !disabled ? (
          <a
            href={to ?? href}
            {...(to
              ? { onClick: onHikkaLinkClick }
              : { target: '_blank', rel: 'noopener noreferrer' })}
            className="group/header-title focus-visible:ring-ring/50 -mx-1.5 -my-1.5 inline-flex min-h-10 min-w-0 items-center gap-1 rounded-md px-1.5 py-1.5 outline-none focus-visible:ring-[3px]"
          >
            <span className="underline-offset-4 group-hover/header-title:underline">
              {title}
            </span>
            <MaterialSymbolsChevronRightRounded
              aria-hidden
              className="text-muted-foreground group-hover/header-title:text-foreground shrink-0 transition-transform group-hover/header-title:translate-x-0.5"
            />
          </a>
        ) : (
          title
        )}
        {icon}
      </h2>
      {children && (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default BlockHeader;
