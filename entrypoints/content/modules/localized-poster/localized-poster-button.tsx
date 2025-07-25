import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { FC } from 'react';
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
import localizedPoster, { posterState } from './localized-poster';

const localizedPosterButton = async () => {
  if (document.body.querySelectorAll('localized-poster-button').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'localized-poster-button',
    position: 'inline',
    append: 'first',
    anchor: document.querySelector('div.absolute.bottom-2.right-2')!,
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

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
    if (initalized && data?.poster)
      localizedPoster(isPosterVisible).then((ui) => ui?.mount());
  }, [data, initalized, isPosterVisible]);

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
