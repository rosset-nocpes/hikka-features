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
}

/** A button the extension adds to a title's navbar, e.g. to open the player. */
const NavbarAction: FC<Props> = ({
  enabled,
  status: { isLoading, isError, found },
  label,
  icon,
  onClick,
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
          className="gap-2"
          disabled={isLoading || isError}
          onClick={onClick}
        >
          <SwapIcon
            active={isLoading}
            on={<Spinner className="size-full" />}
            off={icon}
            className="size-5"
          />
          <RotatingText
            text={isLoading ? 'Шукаю' : isError ? 'Немає' : found ? label : ''}
          />
        </Button>
        <div className="bg-secondary w-px" />
      </motion.div>
    )}
  </AnimatePresence>
);

export default NavbarAction;
