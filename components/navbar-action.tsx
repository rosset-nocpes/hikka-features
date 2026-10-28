import type { FC, ReactNode } from 'react';

import { AnimatePresence, motion } from 'motion/react';

import { RotatingText } from '@/components/animate-ui/text/rotating';
import SwapIcon from '@/components/swap-icon';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { reveal } from '@/utils/motion';

interface Props {
  enabled: boolean;
  /** The query looking for something to open. */
  status: { isLoading: boolean; isError: boolean; found: boolean };
  label: string;
  icon: ReactNode;
  onClick: () => void;
  /** More actions, after the button once something is found. */
  children?: ReactNode;
}

const statusText = (
  { isLoading, isError, found }: Props['status'],
  label: string,
) => (isLoading ? 'Шукаю' : isError ? 'Немає' : found ? label : '');

/** A button the extension adds to a title's navbar, e.g. to open the player. */
const NavbarAction: FC<Props> = ({
  enabled,
  status,
  label,
  icon,
  onClick,
  children,
}) => (
  <AnimatePresence>
    {enabled && (
      <motion.div
        {...reveal('width', { marginRight: '0.5rem' })}
        className="flex gap-2 overflow-hidden"
      >
        <Button
          variant="ghost"
          size="md"
          // Phones' navbar only fits the icon; the label still names it.
          aria-label={statusText(status, label) || undefined}
          className="gap-2 max-sm:px-2.5"
          disabled={status.isLoading || status.isError}
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
        {status.found && children}
        <div className="bg-secondary w-px" />
      </motion.div>
    )}
  </AnimatePresence>
);

export default NavbarAction;
