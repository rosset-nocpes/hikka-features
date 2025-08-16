import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { type FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RotatingText } from '@/components/animate-ui/text/rotating';
import { Button } from '@/components/ui/button';
import HikkaLogoMono from '@/public/hikka-features-mono.svg';
import { queryClient } from '../..';
import player from './player';

export default async function watchButton(location?: Element) {
  if (document.body.querySelectorAll('watch-button').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'watch-button',
    position: 'inline',
    append: 'last',
    anchor:
      location ||
      document.querySelector(
        'main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div > div',
      ),
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <WatchButton container={container} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
}

interface Props {
  container: HTMLElement;
}

const WatchButton: FC<Props> = ({ container }) => {
  const [buttonState, setButtonState] = useState<boolean>();

  const { data, isLoading, isError } = useWatchData();

  const openPlayer = () => {
    document.body.classList.toggle('h-full');
    document.body.classList.toggle('overflow-hidden');
    player().then((ui) => ui.mount());
  };

  useEffect(() => {
    if (data === null || data === undefined) return;

    const path_params = new URLSearchParams(document.location.search);

    if (
      path_params.has('room') ||
      (path_params.has('playerProvider') &&
        path_params.has('playerTeam') &&
        path_params.has('playerEpisode'))
    ) {
      document.body.classList.toggle('h-full');
      document.body.classList.toggle('overflow-hidden');
      player().then((ui) => ui.mount());
    }
  }, [data]);

  watchButtonState.watch((state) => setButtonState(state));

  const dark = container.classList.contains('dark');
  useEffect(() => {
    const initializeAsync = async () => {
      setButtonState(await watchButtonState.getValue());
    };
    initializeAsync();
  }, []);

  const statusMessage = isLoading
    ? 'Шукаю'
    : isError
      ? 'Немає'
      : data
        ? 'Перегляд'
        : '';

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
            className="w-full gap-2"
            disabled={isLoading || isError}
            onClick={openPlayer}
          >
            <motion.img
              src={HikkaLogoMono}
              className={!dark ? 'invert' : ''}
              layout
            />
            <RotatingText text={statusMessage} />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
