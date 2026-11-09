import { AnimatePresence, motion } from 'motion/react';

/** Text that slides up and out as the next `text` slides in. */
export function RotatingText({ text }: { text: string }) {
  return (
    <div className="relative">
      <div className="absolute top-1/2 -translate-y-1/2 overflow-hidden py-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={text}
            transition={{ duration: 0.2, ease: 'easeInOut', type: 'spring' }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {text}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="invisible opacity-0" aria-hidden>
        {text}
      </span>
    </div>
  );
}
