import type { FC } from 'react';

import { AnimatePresence, motion } from 'motion/react';
import MaterialSymbolsPersonalizedRecommendations from '~icons/material-symbols/personalized-recommendations';

import { HFLogo } from '@/components/feature-card';
import BlockHeader from '@/components/hikka/block-header';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import EmptyState from '@/components/ui/empty-state';
import { reveal } from '@/utils/motion';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class RecommendationBlockFeature extends BaseFeature {
  readonly id = 'recommendation-block';
  readonly pages = [
    HikkaPages.AnimeMainPage,
    HikkaPages.MangaMainPage,
    HikkaPages.NovelMainPage,
  ];

  async init() {
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: 'before',
      anchor: '#content-center > div:last-of-type',
      hostCss: 'margin-top: -2rem !important;',
      render: () => <RecommendationBlock />,
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
          {...reveal('height', { marginTop: '2rem' })}
          className="flex min-w-0 flex-col gap-5"
        >
          <BlockHeader
            title="Схожий контент"
            href={`https://myanimelist.net/${contentType === 'novel' ? 'manga' : contentType}/${content_data.mal_id}`}
            disabled={isLoading || data?.recommendations.length === 0}
            icon={<HFLogo />}
          />
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
            {!data?.recommendations.length && (
              <EmptyState
                bordered
                icon={<MaterialSymbolsPersonalizedRecommendations />}
                title="Рекомендацій не знайдено"
                description="Рікка засмучена через відсутність рекомендацій"
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
                      alt={hikkaTitle(item)}
                      loading="lazy"
                    />
                  </AspectRatio>
                  <span className="line-clamp-2 text-sm leading-5 font-medium">
                    {hikkaTitle(item)}
                  </span>
                </a>
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
