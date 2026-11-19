import { AnimatePresence, motion } from 'motion/react';

import { Spinner } from '@/components/ui/spinner';

const BufferingIndicator = () => {
  const { isBuffering } = useIFramePlayer();

  return (
    <AnimatePresence>
      {isBuffering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.3 } }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-40 flex h-full w-full items-center justify-center"
        >
          <div className="rounded-full bg-black/50 p-3 text-white backdrop-blur-sm">
            <Spinner className="size-10" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BufferingIndicator;
