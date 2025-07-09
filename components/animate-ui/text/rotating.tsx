'use client';

import {
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  type Transition,
} from 'motion/react';

type RotatingTextProps = {
  text: string | string[];
  initial?: boolean;
  duration?: number;
  transition?: Transition;
  y?: number;
  containerClassName?: string;
} & HTMLMotionProps<'div'>;

function RotatingText({
  text,
  initial = false,
  y = -50,
  duration = 2000,
  transition = { duration: 0.2, ease: 'easeInOut', type: 'spring' },
  containerClassName,
  ...props
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!Array.isArray(text)) return;
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % text.length);
    }, duration);
    return () => clearInterval(interval);
  }, [text, duration]);

  const currentText = Array.isArray(text) ? text[index] : text;

  return (
    <div className="relative">
      <div
        className={cn(
          '-translate-y-1/2 absolute top-1/2 overflow-hidden py-1',
          containerClassName,
        )}
      >
        <AnimatePresence mode="wait" initial={initial}>
          <motion.div
            key={currentText}
            transition={transition}
            initial={{ opacity: 0, y: -y }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y }}
            {...props}
          >
            {currentText}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="invisible opacity-0" aria-hidden>
        {currentText}
      </span>
    </div>
  );
}

export { RotatingText, type RotatingTextProps };
