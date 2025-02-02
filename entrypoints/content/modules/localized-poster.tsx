import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useNotionData from '@/hooks/use-notion-data';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentScriptContext } from 'wxt/client';
import MaterialSymbolsPlannerBannerAdPtOutlineRounded from '~icons/material-symbols/planner-banner-ad-pt-outline-rounded';
import MaterialSymbolsPlannerBannerAdPtRounded from '~icons/material-symbols/planner-banner-ad-pt-rounded';
import { queryClient } from '..';

const localizedPoster = async (ctx: ContentScriptContext, anime_data: any) => {
  if (document.body.querySelectorAll('localized-poster').length !== 0) {
    return;
  }

  return createShadowRootUi(ctx, {
    name: 'localized-poster',
    position: 'inline',
    append: 'first',
    anchor: document.querySelector('div.absolute.left-0.top-0:nth-child(1)')!,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.height = '100%';
      container.style.width = '100%';
      wrapper.style.height = '100%';
      wrapper.style.width = '100%';
      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <LocalizedPoster anime_data={anime_data} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  anime_data: any;
}

const LocalizedPoster: FC<Props> = ({ anime_data }) => {
  const { data, isLoading, isError } = useNotionData(anime_data.slug);

  const [isLoaded, setIsLoaded] = useState(false);
  const [posterState, togglePosterState] = useState<boolean>(false);
  const [posterButtonState, togglePosterButtonState] = useState<boolean>(false);

  useEffect(() => {
    const initializeAsync = async () => {
      togglePosterState(await localizedPosterState.getValue());
      togglePosterButtonState(await localizedPosterButtonState.getValue());
    };

    initializeAsync();

    const unsubscribe = localizedPosterButtonState.watch((state) =>
      togglePosterButtonState(state),
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (data && data.poster) {
      const img = new Image();
      img.src = data.poster;

      img.onload = () => setIsLoaded(true);
    }
  }, [data]);

  return (
    <AnimatePresence>
      {posterButtonState && data?.poster && (
        <motion.div
          key="poster-button"
          initial={{ opacity: 0, transform: 'translateX(10px)' }}
          animate={{ opacity: 1, transform: 'translateX(0px)' }}
          exit={{ opacity: 0, transform: 'translateX(10px)' }}
          transition={{ duration: 0.2 }}
          className="absolute right-12 bottom-2 z-[1]"
        >
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-md"
                  onClick={() => togglePosterState(!posterState)}
                >
                  {posterState && (
                    <MaterialSymbolsPlannerBannerAdPtRounded className="text-white text-xl" />
                  )}
                  {!posterState && (
                    <MaterialSymbolsPlannerBannerAdPtOutlineRounded className="text-white text-xl" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Локалізувати постер</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      )}
      {posterState && isLoaded && data?.poster && (
        <motion.img
          key="poster"
          alt="Localized Poster"
          decoding="async"
          className="size-full object-cover"
          style={{ color: 'transparent' }}
          src={data.poster}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'cubic-bezier(0.77, 0, 0.18, 1)' }}
        />
      )}
    </AnimatePresence>
  );
};

export default localizedPoster;
