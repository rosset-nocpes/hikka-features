import type { FC } from 'react';

import { AnimatePresence, motion } from 'motion/react';
import MaterialSymbolsPersonalizedRecommendations from '~icons/material-symbols/personalized-recommendations';

import { HFLogo } from '@/components/feature-card';
import BlockHeader from '@/components/hikka/block-header';
import ContentCard, {
  ContentCardSkeleton,
} from '@/components/hikka/content-card';
import EmptyState from '@/components/ui/empty-state';
import { recommendationsPagePath } from '@/utils/hikka-router';
import { reveal } from '@/utils/motion';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

/** Titles the block shows; its title opens the page with all of them. */
const SHOWN = 5;

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
      render: (container) => <RecommendationBlock container={container} />,
    });
  }
}

const RecommendationBlock: FC<{ container: HTMLElement }> = ({ container }) => {
  const { enabled } = useSettings().features.recommendationBlock;

  const { contentType, slug } = usePageStore();
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
            to={
              contentType && slug
                ? recommendationsPagePath(contentType, slug)
                : undefined
            }
            disabled={isLoading || !data?.length}
            icon={<HFLogo />}
          />
          <div className="no-scrollbar md:gradient-mask-none auto-cols-scroll grid-cols-scroll grid-min-6 relative -mx-4 -my-4 grid grid-flow-col gap-4 overflow-x-scroll p-4 sm:grid-cols-4 md:grid-cols-5 lg:gap-6">
            {isLoading &&
              Array.from({ length: SHOWN }).map((_, index) => (
                <ContentCardSkeleton key={index} />
              ))}
            {!isLoading && !data?.length && (
              <EmptyState
                bordered
                icon={<MaterialSymbolsPersonalizedRecommendations />}
                title="Рекомендацій не знайдено"
                description="Рікка засмучена через відсутність рекомендацій"
                className="col-span-5"
              />
            )}
            {data?.slice(0, SHOWN).map((item) => (
              <ContentCard
                key={item.slug}
                item={item}
                container={container}
                newTab
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
