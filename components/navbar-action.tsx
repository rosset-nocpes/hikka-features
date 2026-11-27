import type { FC, ReactNode } from 'react';

import { AnimatePresence, motion } from 'motion/react';

import { RotatingText } from '@/components/animate-ui/text/rotating';
import SwapIcon from '@/components/swap-icon';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Spinner } from '@/components/ui/spinner';
import { reveal } from '@/utils/motion';

interface Props {
  enabled: boolean;
  /** The query looking for something to open. */
  status: { isLoading: boolean; found: boolean };
  label: string;
  icon: ReactNode;
  onClick: () => void;
  /**
   * A menu trigger joined to the button as a split button once something is
   * found, e.g. the queue's.
   */
  menu?: ReactNode;
}

const statusText = ({ isLoading, found }: Props['status'], label: string) =>
  isLoading ? 'Шукаю' : found ? label : 'Немає';

/** A button the extension adds to a title's navbar, e.g. to open the player. */
const NavbarAction: FC<Props> = ({
  enabled,
  status,
  label,
  icon,
  onClick,
  menu,
}) => {
  const split = status.found && !!menu;
  return (
    <AnimatePresence>
      {enabled && (
        <motion.div
          {...reveal('width', { marginRight: '0.5rem' })}
          // Clipped for the reveal, with room for a badge over the corner.
          className="flex gap-2 overflow-clip [overflow-clip-margin:0.5rem]"
        >
          <ButtonGroup
            className={cn(
              'rounded-md',
              split &&
                // A hovered segment needs more contrast than `muted` has over the fill.
                'bg-muted/50 dark:bg-muted/40 *:data-slot:hover:bg-foreground/6 *:data-slot:aria-expanded:bg-foreground/6',
            )}
          >
            <Button
              variant="ghost"
              size="md"
              // Phones' navbar only fits the icon; the label still names it.
              aria-label={statusText(status, label) || undefined}
              className={cn('gap-2 max-sm:px-2.5', split && 'sm:pr-2.5')}
              disabled={!status.found}
              onClick={onClick}
            >
              <SwapIcon
                active={status.isLoading}
                on={<Spinner className="size-full" />}
                off={icon}
                className="size-5"
              />
              <div className="max-sm:hidden">
                <RotatingText text={statusText(status, label)} />
              </div>
            </Button>
            {split && (
              <>
                <div aria-hidden className="bg-border my-2.5 w-px" />
                {menu}
              </>
            )}
          </ButtonGroup>
          {/* The joined menu sets the actions apart well enough on phones,
              whose navbar has no room to spare. */}
          <div className={cn('bg-secondary w-px', split && 'max-sm:hidden')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NavbarAction;

/** Where a title page's navbar actions go: first in its card, flush right. */
export const NAVBAR_ACTION_UI = {
  position: 'inline',
  append: 'first',
  anchor: '#navbar-card',
  hostCss: 'margin-right: -0.5rem !important;',
} as const;
