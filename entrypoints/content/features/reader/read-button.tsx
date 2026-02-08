import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import type { FC } from 'react';
import { createRoot } from 'react-dom/client';
import { RotatingText } from '@/components/animate-ui/text/rotating';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import MaterialSymbolsMenuBookOutlineRounded from '~icons/material-symbols/menu-book-outline-rounded';
import { queryClient } from '../..';
import useReadData from './hooks/use-read-data';
import reader from './reader';
import type { ReaderType } from './reader.enums';

const MOUNT_TAG = 'read-button';

const readButton = async (type: ReaderType, location?: Element) => {
  if (document.body.querySelectorAll(MOUNT_TAG).length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: MOUNT_TAG,
    position: 'inline',
    append: 'first',
    anchor: location || 'div.sticky.bottom-3.z-10.mt-12 > div',
    css: `:host(read-button) { margin-right: -0.5rem; ${getThemeVariables()} }`,
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <ReadButton type={type} container={container} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  type: ReaderType;
  container: HTMLElement;
}

const ReadButton: FC<Props> = ({ type }) => {
  const { enabled } = useSettings().features.reader;

  const { data, isLoading, isError } = useReadData(type);

  const openReader = () => {
    document.body.classList.toggle('h-full');
    document.body.classList.toggle('overflow-hidden');
    reader(type).then((ui) => ui.mount());
  };

  const statusMessage = isLoading
    ? 'Шукаю'
    : isError
      ? 'Немає'
      : data
        ? 'Читати'
        : '';

  return (
    <AnimatePresence>
      {enabled && (
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

export default readButton;
