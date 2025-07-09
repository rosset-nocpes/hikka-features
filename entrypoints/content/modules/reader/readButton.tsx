import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import type { FC } from 'react';
import { createRoot } from 'react-dom/client';
import { RotatingText } from '@/components/animate-ui/text/rotating';
import { Button } from '@/components/ui/button';
import HikkaLogoMono from '@/public/hikka-features-mono.svg';
import { queryClient } from '../..';
import reader from './reader';

const readButton = async (location?: Element) => {
  if (document.body.querySelectorAll('read-button').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'read-button',
    position: 'inline',
    append: 'last',
    anchor:
      location ||
      document.querySelector(
        'main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div > div',
      ),
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

  const dark = container.classList.contains('dark');
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading || isError}
            onClick={openReader}
          >
            <motion.img
              src={HikkaLogoMono}
              className={!dark ? 'invert' : ''}
              layout
            />
            <RotatingText text={statusMessage} />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default readButton;
