import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { type FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RotatingText } from '@/components/animate-ui/text/rotating';
import { Button } from '@/components/ui/button';
import MaterialSymbolsSubscriptionsOutlineRounded from '~icons/material-symbols/subscriptions-outline-rounded';
import { queryClient } from '../..';
import reader from './reader';

const readButton = async (location?: Element) => {
  if (document.body.querySelectorAll('read-button').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'read-button',
    position: 'inline',
    append: 'first',
    anchor:
      location ||
      document.querySelector('div.sticky.bottom-4.z-10.mt-12 > div'),
    css: ':host(read-button) { margin-right: -0.5rem; }',
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <ReadButton container={container} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  container: HTMLElement;
}

const ReadButton: FC<Props> = ({ container }) => {
  const [buttonState, setButtonState] = useState<boolean>();

  const { data, isLoading, isError } = useReadData();

  const openReader = () => {
    document.body.classList.toggle('h-full');
    document.body.classList.toggle('overflow-hidden');
    reader().then((ui) => ui.mount());
  };

  readerButtonState.watch((state) => setButtonState(state));

  useEffect(() => {
    const initializeAsync = async () => {
      setButtonState(await readerButtonState.getValue());
    };

    initializeAsync();
  }, []);

  const statusMessage = isLoading
    ? 'Шукаю'
    : isError
      ? 'Немає'
      : data
        ? 'Читати'
        : '';

  return (
    <AnimatePresence>
      {buttonState && (
        <motion.div
          initial={{ opacity: 0, width: 0, scale: 0.93 }}
          animate={{ opacity: 1, width: 'auto', scale: 1 }}
          exit={{ opacity: 0, width: 0, scale: 0.93 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            'flex gap-2 overflow-hidden',
            buttonState ? 'mr-2' : 'mr-0',
          )}
        >
          <Button
            variant="ghost"
            size="md"
            className="gap-2"
            disabled={isLoading || isError}
            onClick={openReader}
          >
            <MaterialSymbolsSubscriptionsOutlineRounded className="!size-5" />
            <RotatingText text={statusMessage} />
          </Button>
          <div className="w-px bg-secondary" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default readButton;
