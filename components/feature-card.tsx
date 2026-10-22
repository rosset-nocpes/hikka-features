import type { FC, PropsWithChildren, ReactNode } from 'react';

import { motion } from 'motion/react';

import BlockHeader from '@/components/hikka/block-header';
import HFLogoSmallDark from '@/public/hikka-features-small-dark.svg';
import HFLogoSmall from '@/public/hikka-features-small.svg';
import { reveal } from '@/utils/motion';

/** The extension's mark, so its blocks stand apart from the site's own. */
export const HFLogo = () => (
  <img
    alt=""
    src={hikkaTheme.isDark ? HFLogoSmall : HFLogoSmallDark}
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
    className="flex min-w-0 flex-col gap-3"
    {...reveal('height', marginBottom ? { marginBottom } : undefined)}
  >
    <BlockHeader title={title} icon={badge} />
    <div
      className={cn(
        'surface border-border relative isolate flex min-w-0 flex-col gap-4 overflow-clip rounded-lg border p-4',
        className,
      )}
    >
      {children}
    </div>
  </motion.div>
);

export default FeatureCard;
