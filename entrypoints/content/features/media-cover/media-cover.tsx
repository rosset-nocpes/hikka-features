import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { queryClient } from '../..';
import useMediaCover from './hooks/use-media-cover';

const MOUNT_TAG = 'media-cover';

let isMounting = false;

const mediaCover = async () => {
  const existing = document.body.querySelectorAll(MOUNT_TAG);
  if (existing.length > 0 || isMounting) return;

  isMounting = true;

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: MOUNT_TAG,
    position: 'inline',
    append: 'last',
    anchor: 'main',
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <MediaCover />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

const MediaCover = () => {
  const { enabled } = useSettings().features.aniBackground;
  const { data: cover_url } = useMediaCover();

  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <AnimatePresence>
      {enabled && cover_url && (
        <motion.div
          key={cover_url}
          className="absolute left-0 top-0 -z-20 h-80 w-full overflow-hidden opacity-40"
          initial={{ height: 0 }}
          animate={{ height: imageLoaded ? '20rem' : 0 }}
          exit={{ height: 0 }}
        >
          <img
            id="cover"
            alt="cover"
            src={cover_url}
            fetchPriority="high"
            decoding="async"
            sizes="100vw"
            className="relative size-full object-cover !transition gradient-mask-b-0"
            style={{
              position: 'absolute',
              inset: 0,
              height: '100%',
              width: '100%',
              color: 'transparent',
            }}
            ref={(img) => {
              if (img) setImageLoaded(img.complete);
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default mediaCover;
