import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MaterialSymbolsPlannerBannerAdPtOutlineRounded from '~icons/material-symbols/planner-banner-ad-pt-outline-rounded';
import MaterialSymbolsPlannerBannerAdPtRounded from '~icons/material-symbols/planner-banner-ad-pt-rounded';

import { cn } from '@/utils/cn';
import { syncFeatureTheme } from '@/utils/utils';

import { queryClient } from '..';
import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class LocalizedPosterFeature extends BaseFeature {
  readonly id = 'localized-poster';
  readonly pages = [HikkaPages.AnimeMainPage];

  async init() {
    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      append: 'first',
      anchor: '#content-cover div.relative div.relative',
      inheritStyles: true,
      onMount: (container) => {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        syncFeatureTheme(container, { themeVariables: true });

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
            <LocalizedPoster />
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

const EASE = [0.22, 1, 0.36, 1] as const;

const LocalizedPoster = () => {
  const { data } = useNotionData();
  const { enabled, autoShow } = useSettings().features.localizedPoster;

  const [visible, setVisible] = useState(autoShow);
  const [imageLoaded, setImageLoaded] = useState(false);
  const canShow = enabled && !!data?.poster;

  const togglePoster = () => setVisible((v) => !v);

  useEffect(() => {
    if (!data?.poster) return;
    setImageLoaded(false);
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(false);
    img.src = data.poster;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [data?.poster]);

  return (
    <AnimatePresence>
      {imageLoaded && (
        <motion.img
          key="poster"
          alt="Localized Poster"
          decoding="async"
          className="size-full object-cover [overflow-clip-margin:unset]"
          style={{ color: 'transparent' }}
          src={data?.poster}
          initial={{ opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={{
            opacity: 1,
            clipPath: visible ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
            filter: visible ? 'blur(0px)' : 'blur(6px)',
          }}
          exit={{ opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      )}
      {canShow && imageLoaded && (
        <motion.button
          key="poster-toggle"
          type="button"
          aria-pressed={visible}
          aria-label="Локалізувати постер"
          onClick={togglePoster}
          className={cn(
            'group absolute inset-x-0 bottom-0 z-10 flex cursor-pointer items-end justify-center gap-1.5 pt-8 pb-2.5',
            'bg-linear-to-t from-black/55 via-black/25 to-transparent text-white',
            'mask-[linear-gradient(to_top,black_55%,transparent)] backdrop-blur-[2px]',
            'transition-[padding-top] duration-300 ease-out hover:pt-12',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium tracking-wide',
              'ring-1 ring-white/15 backdrop-blur-md',
              'translate-y-1 opacity-0 transition-all duration-200 ease-out',
              'group-hover:translate-y-0 group-hover:opacity-100',
            )}
          >
            {visible ? (
              <MaterialSymbolsPlannerBannerAdPtRounded className="text-base" />
            ) : (
              <MaterialSymbolsPlannerBannerAdPtOutlineRounded className="text-base" />
            )}
            Локалізований постер
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
