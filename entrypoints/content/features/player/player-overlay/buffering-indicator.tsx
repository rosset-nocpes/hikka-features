import { AnimatePresence, motion } from 'motion/react';

import { Spinner } from '@/components/ui/spinner';

const BufferingIndicator = () => {
  const { isBuffering } = useIFramePlayer();

  return (
    <AnimatePresence>
      {isBuffering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-40 flex h-full w-full items-center justify-center">
          <Spinner className="size-20" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BufferingIndicator;
