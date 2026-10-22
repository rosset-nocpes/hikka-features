import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import MaterialSymbolsPlannerBannerAdPtOutlineRounded from '~icons/material-symbols/planner-banner-ad-pt-outline-rounded';
import MaterialSymbolsPlannerBannerAdPtRounded from '~icons/material-symbols/planner-banner-ad-pt-rounded';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class LocalizedPosterFeature extends BaseFeature {
  readonly id = 'localized-poster';
  readonly pages = [HikkaPages.AnimeMainPage];

  async init() {
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: 'first',
      anchor: '#content-cover div.relative div.relative',
      // Covers the site's poster.
      onMount: (container, wrapper) => {
        Object.assign(container.style, {
          position: 'absolute',
          zIndex: '1',
          inset: '0',
          width: '100%',
          height: '100%',
        });
        Object.assign(wrapper.style, { width: '100%', height: '100%' });
      },
      render: () => <LocalizedPoster />,
    });
  }
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Waits for `src` to load, so it never shows half drawn. */
const useImageLoaded = (src?: string) => {
  const [loaded, setLoaded] = useState<string>();

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => setLoaded(src);
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);

  return !!src && loaded === src;
};

const LocalizedPoster = () => {
  const { data } = useNotionData();
  const { enabled, autoShow } = useSettings().features.localizedPoster;
  const [visible, setVisible] = useState(autoShow);
  const imageLoaded = useImageLoaded(data?.poster);

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
      {enabled && imageLoaded && (
        <motion.button
          key="poster-toggle"
          type="button"
          aria-pressed={visible}
          aria-label="Локалізувати постер"
          onClick={() => setVisible((shown) => !shown)}
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
