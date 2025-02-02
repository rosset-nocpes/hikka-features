import { Button } from '@/components/ui/button';
import useWatchData from '@/hooks/use-watch-data';
import HikkaLogoMono from '@/public/hikka-features-mono.svg';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentScriptContext } from 'wxt/client';
import { queryClient } from '../..';
import player from './player';

export default async function watchButton(
  ctx: ContentScriptContext,
  anime_data: any,
  location?: Element,
) {
  if (document.body.querySelectorAll('watch-button').length !== 0) {
    return;
  }

  return createShadowRootUi(ctx, {
    name: 'watch-button',
    position: 'inline',
    append: 'last',
    anchor:
      location ||
      document.querySelector(
        'body > div > main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div > div',
      )!,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <WatchButton
            container={container}
            ctx={ctx}
            anime_data={anime_data}
          />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
}

interface Props {
  container: HTMLElement;
  ctx: ContentScriptContext;
  anime_data: any;
}

const WatchButton: FC<Props> = ({ container, ctx, anime_data }) => {
  const [playerDisabled, togglePlayerDisabled] = useState(true);
  const [buttonState, setButtonState] = useState<boolean>();

  const { data, isLoading, isError } = useWatchData(anime_data);

  useEffect(() => {
    if (data === null || data === undefined) return;

    const path_params = new URLSearchParams(document.location.search);

    if (path_params.has('room')) {
      document.body.classList.toggle('h-full');
      document.body.classList.toggle('overflow-hidden');
      player(ctx, data!, anime_data).then((ui) => ui.mount());
    }
  }, [data]);

  const [playerState, togglePlayerState] = useState(false);

  // -1 - loading; 0 - not found; 1 - found;
  const [state, setState] = useState(-1);

  watchButtonState.watch((state) => setButtonState(state));

  const dark = container.classList.contains('dark');
  useEffect(() => {
    const initializeAsync = async () => {
      setButtonState(await watchButtonState.getValue());
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
            className="w-full gap-2"
            disabled={isLoading || isError}
            onClick={() => {
              document.body.classList.toggle('h-full');
              document.body.classList.toggle('overflow-hidden');
              player(ctx, data!, anime_data).then((ui) => ui.mount());
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
                  key="viewing"
                  variants={transitionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transitionVariants.transition}
                >
                  Перегляд
                </motion.a>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
