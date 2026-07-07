import type { FC } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { createRoot } from 'react-dom/client';
import MaterialSymbolsPersonalizedRecommendations from '~icons/material-symbols/personalized-recommendations';

import BlockButton from '@/components/hikka/block-button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import EmptyState from '@/components/ui/empty-state';
import HFLogoSmallDark from '@/public/hikka-features-small-dark.svg';
import HFLogoSmall from '@/public/hikka-features-small.svg';

import { queryClient } from '..';
import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class RecommendationBlockFeature extends BaseFeature {
  readonly id = 'recommendation-block';
  readonly pages = [
    HikkaPages.AnimeMainPage,
    HikkaPages.MangaMainPage,
    HikkaPages.NovelMainPage,
  ];

  async init() {
    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      append: 'after',
      anchor: '#content-center > section:last-of-type',
      css: `:host(${this.id}) { margin-top: -2rem !important; }`,
      inheritStyles: true,
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        syncFeatureTheme(container, { themeVariables: true });

        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <RecommendationBlock />
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

const RecommendationBlock: FC = () => {
  const { enabled } = useSettings().features.recommendationBlock;

  const { contentType } = usePageStore();
  const { data: content_data } = useHikka();
  const { data, isLoading } = useRecommendation();

  return (
    <AnimatePresence>
      {enabled && content_data && (
        <motion.div
          initial={{ opacity: 0, height: 0, scale: 0.93, marginTop: 0 }}
          animate={{
            opacity: 1,
            height: 'auto',
            scale: 1,
            marginTop: '2rem',
          }}
          exit={{ opacity: 0, height: 0, scale: 0.93, marginTop: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col gap-4 lg:gap-6"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center justify-between gap-2">
              Схожий контент
              <img
                src={isHikkaDarkMode() ? HFLogoSmall : HFLogoSmallDark}
                style={{ width: '21px', height: '20px' }}
              />
            </h3>
            <BlockButton
              href={`https://myanimelist.net/${contentType === 'novel' ? 'manga' : contentType}/${content_data.mal_id}`}
              disabled={isLoading || data?.recommendations.length === 0}
            />
          </div>
          <div className="no-scrollbar md:gradient-mask-none auto-cols-scroll grid-cols-scroll grid-min-6 relative -mx-4 -my-4 grid grid-flow-col gap-4 overflow-x-scroll p-4 sm:grid-cols-4 md:grid-cols-5 lg:gap-6">
            {isLoading &&
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <AspectRatio
                    ratio={0.7}
                    className="skeleton bg-secondary/60 animate-pulse rounded-md"
                  />
                  <div className="skeleton bg-secondary/60 h-5 animate-pulse rounded-full" />
                </div>
              ))}
            {data?.recommendations.length === 0 && (
              <EmptyState
                bordered
                icon={<MaterialSymbolsPersonalizedRecommendations />}
                title="Рекомендацій не знайдено"
                description="Дай боже, щоб хтось на MAL додав рекомендації"
                className="col-span-5"
              />
            )}
            {data &&
              data.recommendations.length > 0 &&
              data.recommendations.map((item) => (
                <a
                  key={item.slug}
                  href={`https://hikka.io/${item.data_type}/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-2"
                >
                  <AspectRatio
                    ratio={0.7}
                    className="bg-muted relative w-full overflow-hidden rounded-md"
                  >
                    <img
                      className="bg-secondary/30 absolute inset-0 h-full w-full object-cover"
                      src={item.image}
                      alt={
                        item.title_ua ||
                        item.title_en ||
                        item.title_ja ||
                        item.title_original
                      }
                      loading="lazy"
                    />
                  </AspectRatio>
                  <span className="line-clamp-2 text-sm leading-5 font-medium">
                    {item?.title_ua ||
                      item?.title_en ||
                      item?.title_ja ||
                      item?.title_original}
                  </span>
                </a>
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
