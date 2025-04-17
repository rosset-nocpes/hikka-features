import { ContentScriptContext } from '#imports';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useNotionData from '@/hooks/use-notion-data';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MaterialSymbolsPlannerBannerAdPtOutlineRounded from '~icons/material-symbols/planner-banner-ad-pt-outline-rounded';
import MaterialSymbolsPlannerBannerAdPtRounded from '~icons/material-symbols/planner-banner-ad-pt-rounded';
import { queryClient } from '../..';
import localizedPoster, { posterState } from './localized-poster';

const localizedPosterButton = async (
  ctx: ContentScriptContext,
  anime_data: any,
) => {
  if (document.body.querySelectorAll('localized-poster-button').length !== 0) {
    return;
  }

  return createShadowRootUi(ctx, {
    name: 'localized-poster-button',
    position: 'inline',
    append: 'first',
    anchor: document.querySelector('div.absolute.bottom-2.right-2')!,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <LocalizedPosterButton
            ctx={ctx}
            container={container}
            anime_data={anime_data}
          />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  ctx: ContentScriptContext;
  container: HTMLElement;
  anime_data: any;
}

const LocalizedPosterButton: FC<Props> = ({ ctx, container, anime_data }) => {
  const { data } = useNotionData(anime_data.slug);

  const [isPosterVisible, setIsPosterVisible] = useState<boolean>(false);
  const [showButton, setShowButton] = useState<boolean>(false);
  const [initalized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initializeAsync = async () => {
      const initialPosterState = await localizedPosterState.getValue();

      setIsPosterVisible(initialPosterState);
      posterState.setVisibility(initialPosterState);

      setShowButton(await localizedPosterButtonState.getValue());

      setInitialized(true);
    };

    initializeAsync();

    const unsubscribe = localizedPosterButtonState.watch((state) =>
      setShowButton(state),
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initalized)
      localizedPoster(ctx, data, isPosterVisible).then((ui) => ui?.mount());
  }, [data, initalized]);

  const togglePoster = () => {
    const newState = !isPosterVisible;
    setIsPosterVisible(newState);

    posterState.setVisibility(newState);
  };

  return (
    <AnimatePresence>
      {showButton && data?.poster && (
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
                    <MaterialSymbolsPlannerBannerAdPtRounded className="text-lg text-white" />
                  )}
                  {!isPosterVisible && (
                    <MaterialSymbolsPlannerBannerAdPtOutlineRounded className="text-lg text-white" />
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
