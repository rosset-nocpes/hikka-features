import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
} from 'motion/react';
import {
  type FC,
  type PropsWithChildren,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';

const transition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] } as const;

const slide = {
  enter: (direction: number) => ({ x: direction * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -24, opacity: 0 }),
};

/** Where the menu opens from; pages stay put on that edge as it resizes. */
type Side = 'top' | 'bottom';

const Page: FC<
  PropsWithChildren<{
    direction: number;
    side: Side;
    onHeight: (height: number) => void;
  }>
> = ({ direction, side, onHeight, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isPresent = useIsPresent();

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !isPresent) return;
    const observer = new ResizeObserver(() => onHeight(node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, [isPresent, onHeight]);

  return (
    <motion.div
      ref={ref}
      custom={direction}
      variants={slide}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className={cn(
        !isPresent && 'pointer-events-none absolute inset-x-0',
        !isPresent && (side === 'top' ? 'bottom-0' : 'top-0'),
      )}
    >
      {children}
    </motion.div>
  );
};

interface Props extends PropsWithChildren {
  /** Changing it slides the new page in. */
  page: string;
  /** 1 slides forward into a submenu, -1 back out of it. */
  direction: number;
  side?: Side;
}

/** Menu pages that slide sideways while the menu resizes to fit them. */
const MenuPages: FC<Props> = ({ page, direction, side = 'top', children }) => {
  const height = useMotionValue<number | 'auto'>('auto');

  const resize = useCallback(
    (next: number) => {
      if (height.get() === 'auto') height.set(next);
      else animate(height, next, transition);
    },
    [height],
  );

  return (
    <motion.div
      style={{ height }}
      className={cn(
        'relative flex flex-col overflow-hidden',
        side === 'top' ? 'justify-end' : 'justify-start',
      )}
    >
      <AnimatePresence initial={false} custom={direction}>
        <Page key={page} direction={direction} side={side} onHeight={resize}>
          {children}
        </Page>
      </AnimatePresence>
    </motion.div>
  );
};

export default MenuPages;
