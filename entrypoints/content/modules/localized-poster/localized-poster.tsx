import { ContentScriptContext } from '#imports';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { queryClient } from '../..';

export const posterState = {
  isVisible: false,
  updateFn: null as ((state: boolean) => void) | null,

  setVisibility(visible: boolean) {
    this.isVisible = visible;
    if (this.updateFn) {
      this.updateFn(visible);
    }
  },
};

const localizedPoster = async (
  ctx: ContentScriptContext,
  slug: string,
  initialPosterState: boolean,
) => {
  posterState.isVisible = initialPosterState;

  if (document.body.querySelectorAll('localized-poster').length !== 0) {
    return;
  }

  return createShadowRootUi(ctx, {
    name: 'localized-poster',
    position: 'inline',
    append: 'first',
    anchor: document.querySelector(
      'div.absolute.left-0.top-0.flex.size-full.items-center.justify-center.rounded-md',
    )!,
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
          <LocalizedPoster slug={slug} initialState={initialPosterState} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  slug: string;
  initialState: boolean;
}

const LocalizedPoster: FC<Props> = ({ slug, initialState }) => {
  const { data } = useNotionData(slug);

  const [isLoaded, setIsLoaded] = useState(false);
  const [showPoster, setShowPoster] = useState(initialState);

  useEffect(() => {
    if (data && data.poster) {
      const img = new Image();
      img.src = data.poster;
      img.onload = () => setIsLoaded(true);
    }
  }, [data]);

  useEffect(() => {
    posterState.updateFn = setShowPoster;

    return () => {
      posterState.updateFn = null;
    };
  }, []);

  return (
    <AnimatePresence>
      {showPoster && isLoaded && data?.poster && (
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
