import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { type FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RotatingText } from '@/components/animate-ui/text/rotating';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import MaterialSymbolsMenuBookOutlineRounded from '~icons/material-symbols/menu-book-outline-rounded';
import { queryClient } from '../..';
import novel_reader from './novel-reader';

const novel_read_button = async (location?: Element) => {
  if (document.body.querySelectorAll('read-button').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'read-button',
    position: 'inline',
    append: 'first',
    anchor:
      location ||
      document.querySelector('div.sticky.bottom-3.z-10.mt-12 > div'),
    css: ':host(read-button) { margin-right: -0.5rem; }',
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <NovelReadButton container={container} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  container: HTMLElement;
}

const NovelReadButton: FC<Props> = ({ container }) => {
  const [buttonState, setButtonState] = useState<boolean>();

  const { data, isLoading, isError } = useNovelData();

  const openReader = () => {
    document.body.classList.toggle('h-full');
    document.body.classList.toggle('overflow-hidden');
    novel_reader().then((ui) => ui.mount());
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
          initial={{ opacity: 0, width: 0, scale: 0.93, marginRight: 0 }}
          animate={{
            opacity: 1,
            width: 'auto',
            scale: 1,
            marginRight: '0.5rem',
          }}
          exit={{ opacity: 0, width: 0, scale: 0.93, marginRight: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex gap-2 overflow-hidden"
        >
          <Button
            variant="ghost"
            size="md"
            className="gap-2"
            disabled={isLoading || isError}
            onClick={openReader}
          >
            <Indicator isLoading={isLoading} />
            <RotatingText text={statusMessage} />
          </Button>
          <div className="w-px bg-secondary" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface IndicatorProps {
  isLoading: boolean;
}

const Indicator = ({ isLoading }: IndicatorProps) => {
  return (
    <div className="relative size-5">
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-[transform,opacity,filter] duration-200 ease-in-out will-change-[transform,opacity,filter]',
          isLoading
            ? 'scale-[0.25] opacity-0 blur-sm'
            : 'scale-100 opacity-100 blur-0',
        )}
      >
        <MaterialSymbolsMenuBookOutlineRounded className="size-full" />
      </div>
      <div
        className={cn(
          'transition-[transform,opacity,filter] duration-200 ease-in-out will-change-[transform,opacity,filter]',
          isLoading
            ? 'scale-100 opacity-100 blur-0'
            : 'scale-[0.25] opacity-0 blur-sm',
        )}
      >
        <Spinner className="size-full" />
      </div>
    </div>
  );
};

export default novel_read_button;
