import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import MaterialSymbolsSubscriptionsOutlineRounded from '~icons/material-symbols/subscriptions-outline-rounded';

import { RotatingText } from '@/components/animate-ui/text/rotating';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { queryClient } from '../..';
import { BaseFeature } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import player from './player';

// export default async function watchButton(location?: Element) {
//   const existing = document.body.querySelectorAll(MOUNT_TAG);
//   if (existing.length > 0) return;

//   return createShadowRootUi(usePageStore.getState().ctx, {
//     name: MOUNT_TAG,
//     position: 'inline',
//     append: 'first',
//     anchor: location || 'main > div:nth-of-type(2) div.relative',
//     css: `:host(${MOUNT_TAG}) { margin-right: -0.5rem !important; ${getThemeVariables()} }`,
//     inheritStyles: true,
//     async onMount(container) {
//       const wrapper = document.createElement('div');
//       container.append(wrapper);

//       const root = createRoot(wrapper);
//       root.render(
//         <QueryClientProvider client={queryClient}>
//           <WatchButton />
//         </QueryClientProvider>,
//       );

//       return { root, wrapper };
//     },
//   });
// }

export default class WatchButtonFeature extends BaseFeature {
  readonly id = 'watch-button';
  readonly pages = [HikkaPages.AnimeContent];

  async init() {
    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      append: 'first',
      anchor: 'main > div:nth-of-type(2) div.relative',
      css: `:host(${this.id}) { margin-right: -0.5rem !important; ${getThemeVariables()} }`,
      inheritStyles: true,
      onMount: (container) => {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <WatchButton />
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

const WatchButton = () => {
  const { enabled } = useSettings().features.player;
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

  const statusMessage = isLoading
    ? 'Шукаю'
    : isError
      ? 'Немає'
      : data
        ? 'Перегляд'
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
            onClick={openPlayer}
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
        <MaterialSymbolsSubscriptionsOutlineRounded className="size-full" />
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
