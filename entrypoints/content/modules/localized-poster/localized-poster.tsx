import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { type FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { queryClient } from '../..';

export const usePosterState = create<{
  visible: boolean;
  setVisible: (visible: boolean) => void;
}>((set) => ({
  visible: false,
  setVisible: (visible) => set({ visible }),
}));

const localizedPoster = async () => {
  if (document.body.querySelectorAll('localized-poster').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'localized-poster',
    position: 'inline',
    append: 'first',
    anchor: document.querySelector(
      'div.absolute.left-0.top-0.flex.size-full.items-center.justify-center.rounded-md',
    ),
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
      const { darkMode } = useSettings.getState();
      container.classList.toggle('dark', darkMode);

      const root = createRoot(wrapper);

      root.render(
        <QueryClientProvider client={queryClient}>
          <LocalizedPoster />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

const LocalizedPoster: FC = () => {
  const { visible } = usePosterState();
  const { data } = useNotionData();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (data?.poster) {
      const img = new Image();
      img.src = data.poster;
      img.onload = () => setIsLoaded(true);
    }
  }, [data]);

  return (
    <AnimatePresence>
      {visible && isLoaded && data?.poster && (
        <motion.img
          key="poster"
          alt="Localized Poster"
          decoding="async"
          className="size-full object-cover [overflow-clip-margin:unset]"
          style={{ color: 'transparent' }}
          src={data.poster}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  );
};

export default localizedPoster;
