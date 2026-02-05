import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { type FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import MaterialSymbolsPlannerBannerAdPtOutlineRounded from '~icons/material-symbols/planner-banner-ad-pt-outline-rounded';
import MaterialSymbolsPlannerBannerAdPtRounded from '~icons/material-symbols/planner-banner-ad-pt-rounded';
import { queryClient } from '../..';
import localizedPoster, { usePosterState } from './localized-poster';

const localizedPosterButton = async () => {
  if (document.body.querySelectorAll('localized-poster-button').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'localized-poster-button',
    position: 'inline',
    append: 'first',
    anchor: document.querySelector(
      '.grid > div.flex.flex-col.gap-4.lg\\:col-span-1 > div.z-0.flex.items-center.px-16.md\\:px-48.lg\\:px-0 > div > div > div',
    ),
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.style.position = 'absolute';
      container.style.bottom = '0.5rem';
      container.style.right = '0.5rem';
      container.style.zIndex = '10';

      const { darkMode } = useSettings.getState();
      container.classList.toggle('dark', darkMode);

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <LocalizedPosterButton container={container} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  container: HTMLElement;
}

const LocalizedPosterButton: FC<Props> = ({ container }) => {
  const { data } = useNotionData();
  const { setVisible } = usePosterState();
  const { enabled, autoShow } = useSettings().features.localizedPoster;

  useEffect(() => {
    if (data?.poster) {
      setVisible(autoShow);
      localizedPoster().then((ui) => ui?.mount());
    }
  }, [data]);

  const togglePoster = () => {
    setVisible(!usePosterState.getState().visible);
  };

  const isPosterVisible = usePosterState((state) => state.visible);

  return (
    <AnimatePresence>
      {enabled && data?.poster && (
        <motion.div
          key="poster-button"
          initial={{ opacity: 0, transform: 'translateX(10px)' }}
          animate={{ opacity: 1, transform: 'translateX(0px)' }}
          exit={{ opacity: 0, transform: 'translateX(10px)' }}
          transition={{ duration: 0.2 }}
        >
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-md" onClick={togglePoster}>
                  {isPosterVisible && (
                    <MaterialSymbolsPlannerBannerAdPtRounded className="text-lg" />
                  )}
                  {!isPosterVisible && (
                    <MaterialSymbolsPlannerBannerAdPtOutlineRounded className="text-lg" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipPortal container={container}>
                <TooltipContent side="top">Локалізувати постер</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default localizedPosterButton;
