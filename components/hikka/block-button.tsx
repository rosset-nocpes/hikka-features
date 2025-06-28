import { FC } from 'react';
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
      <Button size="md" variant="ghost" disabled={disabled} asChild>
        <a
          href={href}
          className="flex items-center gap-2 text-muted-foreground"
          {...linkProps}
        >
          Більше
          <MaterialSymbolsArrowRightAltRounded className="text-sm" />
        </a>
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      size="md"
      className="flex items-center gap-2 text-muted-foreground"
      variant="ghost"
      disabled={disabled}
    >
      Більше
      <MaterialSymbolsArrowRightAltRounded className="text-sm" />
    </Button>
  );
};

export default BlockButton;
