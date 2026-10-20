import type { FC, PropsWithChildren, ReactNode } from 'react';

import { motion } from 'motion/react';

import HFLogoSmallDark from '@/public/hikka-features-small-dark.svg';
import HFLogoSmall from '@/public/hikka-features-small.svg';
import { reveal } from '@/utils/motion';

/** The extension's mark, so its blocks stand apart from the site's own. */
export const HFLogo = () => (
  <img
    alt=""
    src={isHikkaDarkMode() ? HFLogoSmall : HFLogoSmallDark}
    style={{ width: '21px', height: '20px' }}
  />
);

interface Props extends PropsWithChildren {
  title: string;
  /** Next to the title; the extension's mark by default. */
  badge?: ReactNode;
  /** Space kept below the card while it is shown. */
  marginBottom?: string;
  className?: string;
}

/** A block the extension adds to a title's page, in the page's card style. */
const FeatureCard: FC<Props> = ({
  title,
  badge = <HFLogo />,
  marginBottom,
  className,
  children,
}) => (
  <motion.div
    className={cn(
      'border-border bg-secondary/20 overflow-hidden rounded-lg border',
      className,
    )}
    {...reveal('height', marginBottom ? { marginBottom } : undefined)}
  >
    <div className="flex flex-col gap-6 p-4">
      <h4 className="flex items-center justify-between">
        {title}
        {badge}
      </h4>
      {children}
    </div>
  </motion.div>
);

export default FeatureCard;
