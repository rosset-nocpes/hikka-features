import type { FC, ReactNode } from 'react';

import MaterialSymbolsImageNotSupportedOutlineRounded from '~icons/material-symbols/image-not-supported-outline-rounded';

import { AspectRatio } from '@/components/ui/aspect-ratio';

/** A poster in hikka.io's card ratio, with a placeholder when missing. */
export const Poster: FC<{
  image?: string;
  className?: string;
  children?: ReactNode;
}> = ({ image, className, children }) => (
  <AspectRatio
    ratio={0.7}
    className={cn(
      'bg-muted relative w-full overflow-hidden rounded-md',
      className,
    )}
  >
    <div className="bg-secondary/20 absolute inset-0 flex items-center justify-center">
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        <MaterialSymbolsImageNotSupportedOutlineRounded className="text-muted-foreground text-4xl" />
      )}
    </div>
    {children}
  </AspectRatio>
);

/** hikka.io's subtitles under a card's title: "TV Серіал • 2026". */
export const CardMeta: FC<{ items: (string | undefined)[] }> = ({ items }) => {
  const shown = items.filter(Boolean);
  if (shown.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      {shown.map((item, index) => (
        <span key={item} className="contents">
          {index > 0 && (
            <span className="bg-muted-foreground size-1 shrink-0 rounded-full" />
          )}
          <span className="text-muted-foreground text-xs leading-tight font-medium">
            {item}
          </span>
        </span>
      ))}
    </div>
  );
};

/** hikka.io's poster grid: two columns on phones, five beside the contents. */
export const POSTER_GRID =
  'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5';
