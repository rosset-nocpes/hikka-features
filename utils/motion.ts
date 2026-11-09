import type { MotionProps } from 'motion/react';

type Margin = 'marginTop' | 'marginRight' | 'marginBottom';

/**
 * Grows a block into the page as it appears and shrinks it as it goes,
 * along with the `margin` that separates it from its neighbours.
 */
export const reveal = (
  axis: 'height' | 'width' = 'height',
  margin?: Partial<Record<Margin, string>>,
): MotionProps => {
  const hidden = {
    opacity: 0,
    scale: 0.93,
    [axis]: 0,
    ...Object.fromEntries(Object.keys(margin ?? {}).map((side) => [side, 0])),
  };
  return {
    initial: hidden,
    animate: { opacity: 1, scale: 1, [axis]: 'auto', ...margin },
    exit: hidden,
    transition: { duration: 0.2, ease: 'easeOut' },
  };
};
