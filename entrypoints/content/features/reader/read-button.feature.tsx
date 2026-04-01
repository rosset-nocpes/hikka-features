import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { createRoot } from 'react-dom/client';
import MaterialSymbolsMenuBookOutlineRounded from '~icons/material-symbols/menu-book-outline-rounded';

import { RotatingText } from '@/components/animate-ui/text/rotating';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { queryClient } from '../..';
import { BaseFeature } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import useReadData from './hooks/use-read-data';
import reader from './reader';

export default class ReadButtonFeature extends BaseFeature {
  readonly id = 'read-button';
  readonly pages = [HikkaPages.MangaContent, HikkaPages.NovelContent];

  async init() {
    const id = this.id;

    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: id,
      position: 'inline',
      append: 'first',
      anchor: 'div.sticky.bottom-3.z-10.mt-12 > div',
      css: `:host(${id}) { margin-right: -0.5rem !important; ${getThemeVariables()} }`,
      inheritStyles: true,
      onMount: (container) => {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <ReadButton />
          </QueryClientProvider>,
        );

        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
  }
}

const ReadButton = () => {
  const { enabled } = useSettings().features.reader;

  const { data, isLoading, isError } = useReadData();

  const openReader = () => {
    document.body.classList.toggle('h-full');
    document.body.classList.toggle('overflow-hidden');
    reader().then((ui) => ui.mount());
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
