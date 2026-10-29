import type { FC } from 'react';

import { CardMeta, Poster } from '@/components/hikka/poster';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { onHikkaLinkClick } from '@/utils/hikka-router';

import MediaTooltip, {
  MEDIA_TYPES,
  type MediaTooltipItem,
} from './media-tooltip';

/** The parts of a Hikka anime, manga or novel that its card shows. */
export interface ContentCardItem extends MediaTooltipItem {
  slug: string;
  image: string | null;
  year: number | null;
  title_ua: string | null;
  title_en: string | null;
  title_ja?: string | null;
}

interface Props {
  item: ContentCardItem;
  /** The feature UI's container, so the hover card takes its styles. */
  container: HTMLElement;
  /** The year and type under the title, as hikka.io's lists show them. */
  meta?: boolean;
  /** Opens the title in a new tab, not in place. */
  newTab?: boolean;
}

/**
 * hikka.io's card for an anime, manga or novel: its poster and title, and
 * hikka.io's hover card for it on wider screens.
 */
const ContentCard: FC<Props> = ({ item, container, meta, newTab }) => (
  <MediaTooltip item={item} container={container}>
    <a
      href={`/${item.data_type}/${item.slug}`}
      {...(newTab
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : { onClick: onHikkaLinkClick })}
      className="flex flex-col gap-2"
    >
      <Poster image={item.image ?? undefined} />
      <div className="flex flex-col gap-1">
        <span className="line-clamp-2 text-sm leading-5 font-medium">
          {hikkaTitle(item)}
        </span>
        {meta && (
          <CardMeta
            items={[
              item.year?.toString(),
              item.media_type ? MEDIA_TYPES[item.media_type] : undefined,
            ]}
          />
        )}
      </div>
    </a>
  </MediaTooltip>
);

/** A card while its title loads. */
export const ContentCardSkeleton = () => (
  <div className="flex flex-col gap-2">
    <AspectRatio
      ratio={0.7}
      className="skeleton bg-secondary/60 animate-pulse rounded-md"
    />
    <div className="skeleton bg-secondary/60 h-5 animate-pulse rounded-full" />
  </div>
);

export default ContentCard;
