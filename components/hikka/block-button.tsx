import type { FC } from 'react';

import MaterialSymbolsArrowRightAltRounded from '~icons/material-symbols/arrow-right-alt-rounded';

import { Button } from '../ui/button';

interface Props {
  href?: string;
  onClick?: () => void;
  linkProps?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
  disabled?: boolean;
}

const BlockButton: FC<Props> = ({ href, onClick, linkProps, disabled }) => {
  if (!href && !onClick) {
    return null;
  }

  if (href) {
    return (
      <Button size="icon-sm" variant="ghost" disabled={disabled}>
        <a
          href={href}
          className="text-muted-foreground flex items-center gap-2"
          {...linkProps}
        >
          <MaterialSymbolsArrowRightAltRounded className="text-sm" />
        </a>
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      size="icon-sm"
      className="text-muted-foreground flex items-center gap-2"
      variant="ghost"
      disabled={disabled}
    >
      <MaterialSymbolsArrowRightAltRounded className="text-sm" />
    </Button>
  );
};

export default BlockButton;
