import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentScriptContext } from '#imports';
import { Button } from '@/components/ui/button';
import useReadData from '@/hooks/use-read-data';
import HikkaLogoMono from '@/public/hikka-features-mono.svg';
import { queryClient } from '../..';
import reader from './reader';

const readButton = async (
  ctx: ContentScriptContext,
  title: string,
  location?: Element,
) => {
  if (document.body.querySelectorAll('read-button').length !== 0) {
    return;
  }

  return createShadowRootUi(ctx, {
    name: 'read-button',
    position: 'inline',
    append: 'last',
    anchor:
      location ||
      document.querySelector(
        'main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div > div',
      )!,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <ReadButton ctx={ctx} title={title} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  ctx: ContentScriptContext;
  title: string;
}

const ReadButton: FC<Props> = ({ ctx, title }) => {
  const [buttonState, setButtonState] = useState<boolean>();

  const { data, isLoading, isError } = useReadData(title);

  readerButtonState.watch((state) => setButtonState(state));

  let dark = true;
  useEffect(() => {
    const initializeAsync = async () => {
      setButtonState(await readerButtonState.getValue());
      dark = await darkMode.getValue();
    };

    initializeAsync();
  }, []);

  const transitionVariants = {
    initial: { y: -10, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 10, opacity: 0 },
    transition: { duration: 0.2, ease: 'easeInOut', type: 'spring' },
  };

  return (
    <AnimatePresence>
      {buttonState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="outline"
            id="player-button"
            className={cn('w-full gap-2', dark ? 'dark' : '')}
            disabled={isLoading || isError}
            onClick={() => {
              document.body.classList.toggle('h-full');
              document.body.classList.toggle('overflow-hidden');
              reader(ctx, data!, title).then((ui) => ui.mount());
            }}
          >
            <img src={HikkaLogoMono} className={!dark ? 'invert' : ''} />
            <AnimatePresence mode="wait" initial={false}>
              {isLoading && (
                <motion.a
                  key="searching"
                  variants={transitionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transitionVariants.transition}
                >
                  Шукаю
                </motion.a>
              )}
              {isError && (
                <motion.a
                  key="none"
                  variants={transitionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transitionVariants.transition}
                >
                  Немає
                </motion.a>
              )}
              {data && (
                <motion.a
                  key="read"
                  variants={transitionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transitionVariants.transition}
                >
                  Читати
                </motion.a>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default readButton;
