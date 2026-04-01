import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MaterialSymbolsPlannerBannerAdPtOutlineRounded from '~icons/material-symbols/planner-banner-ad-pt-outline-rounded';
import MaterialSymbolsPlannerBannerAdPtRounded from '~icons/material-symbols/planner-banner-ad-pt-rounded';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { queryClient } from '../..';
import { BaseFeature } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';

export default class LocalizedPosterFeature extends BaseFeature {
  readonly id = 'localized-poster';
  readonly pages = [HikkaPages.AnimeMainPage];

  async init() {
    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      append: 'first',
      anchor:
        '.grid.grid-cols-1 > div:nth-of-type(1) > div:nth-of-type(1) div.relative div.relative',
      inheritStyles: true,
      onMount: (container) => {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        container.style = getThemeVariables();
        container.classList.toggle(
          'dark',
          getComputedStyle(document.documentElement).colorScheme === 'dark',
        );

        container.style.position = 'absolute';
        container.style.zIndex = '1';
        container.style.top = '0';
        container.style.left = '0';
        container.style.height = '100%';
        container.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.width = '100%';

        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <LocalizedPoster container={container} />
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

interface Props {
  container: HTMLElement;
}

const LocalizedPoster = ({ container }: Props) => {
  const { data } = useNotionData();
  const { enabled, autoShow } = useSettings().features.localizedPoster;

  const [visible, setVisible] = useState(autoShow);
  const [imageLoaded, setImageLoaded] = useState(false);

  const togglePoster = () => {
    setVisible(!visible);
  };

  return (
    <AnimatePresence>
      {visible && data?.poster && (
        <motion.img
          key="poster"
          alt="Localized Poster"
          decoding="async"
          className="size-full object-cover [overflow-clip-margin:unset]"
          style={{ color: 'transparent' }}
          src={data.poster}
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          ref={(img) => {
            if (img) setImageLoaded(img.complete);
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(false)}
        />
      )}
      {enabled && data?.poster && (
        <motion.div
          key="poster-button"
          className="absolute bottom-2 right-2"
          initial={{ opacity: 0, transform: 'translateX(10px)' }}
          animate={{ opacity: 1, transform: 'translateX(0px)' }}
          exit={{ opacity: 0, transform: 'translateX(10px)' }}
          transition={{ duration: 0.2 }}
        >
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-md"
                  className="flex"
                  onClick={togglePoster}
                >
                  {visible && (
                    <MaterialSymbolsPlannerBannerAdPtRounded className="text-lg" />
                  )}
                  {!visible && (
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
