import { type FC, type ReactElement, type ReactNode, useId } from 'react';
import MaterialSymbolsStarRounded from '~icons/material-symbols/star-rounded';

import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';

/** The parts of a Hikka anime, manga or novel that its card shows. */
export interface MediaTooltipItem {
  data_type: MediaType;
  media_type: string | null;
  status: string | null;
  score: number;
  scored_by: number;
  native_score: number;
  native_scored_by: number;
  synopsis_ua?: string | null;
  synopsis_en?: string | null;
  genres: { slug: string; name_ua: string | null }[];
  episodes_total?: number | null;
  episodes_released?: number | null;
  chapters?: number | null;
  volumes?: number | null;
}

/** hikka.io's names for its media types, of anime and of print alike. */
export const MEDIA_TYPES: Record<string, string> = {
  special: 'Спешл',
  movie: 'Фільм',
  ova: 'OVA',
  ona: 'ONA',
  tv: 'TV Серіал',
  music: 'Музика',
  one_shot: 'Ваншот',
  doujin: 'Доджінші',
  manhua: 'Маньхва',
  manhwa: 'Манхва',
  manga: 'Манґа',
  light_novel: 'Ранобе',
  novel: 'Вебновела',
};

/** Release statuses in hikka.io's colours, which the page passes down. */
const STATUSES: Record<string, { title: string; className: string }> = {
  discontinued: {
    title: 'Припинено',
    className:
      'bg-(--discontinued-background) text-(--discontinued-foreground) border-(--discontinued-border)',
  },
  ongoing: {
    title: 'Онґоїнґ',
    className:
      'bg-(--ongoing-background) text-(--ongoing-foreground) border-(--ongoing-border)',
  },
  finished: {
    title: 'Завершено',
    className:
      'bg-(--finished-background) text-(--finished-foreground) border-(--finished-border)',
  },
  announced: {
    title: 'Анонс',
    className:
      'bg-(--announced-background) text-(--announced-foreground) border-(--announced-border)',
  },
  paused: {
    title: 'Призупинено',
    className:
      'bg-(--paused-background) text-(--paused-foreground) border-(--paused-border)',
  },
};

const COMPACT_NUMBER = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** A markdown link, captured as its text and address. */
const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/;

const linkProps = { target: '_blank', rel: 'noopener noreferrer' };

const MalLogo: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      fill="currentColor"
      d="M8.273 7.247v8.423l-2.103-.003v-5.216l-2.03 2.404l-1.989-2.458l-.02 5.285H.001L0 7.247h2.203l1.865 2.545l2.015-2.546l2.19.001zm8.628 2.069l.025 6.335h-2.365l-.008-2.871h-2.8c.07.499.21 1.266.417 1.779c.155.381.298.751.583 1.128l-1.705 1.125c-.349-.636-.622-1.337-.878-2.082a9.296 9.296 0 0 1-.507-2.179c-.085-.75-.097-1.471.107-2.212a3.908 3.908 0 0 1 1.161-1.866c.313-.293.749-.5 1.1-.687c.351-.187.743-.264 1.107-.359a7.405 7.405 0 0 1 1.191-.183c.398-.034 1.107-.066 2.39-.028l.545 1.749H14.51c-.593.008-.878.001-1.341.209a2.236 2.236 0 0 0-1.278 1.92l2.663.033l.038-1.81h2.309zm3.992-2.099v6.627l3.107.032l-.43 1.775h-4.807V7.187l2.13.03z"
    />
  </svg>
);

const HikkaLogo: FC<{ className?: string }> = ({ className }) => {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 27 27" fill="none" className={className} aria-hidden>
      <path
        d="M4.4708 0.70609L0.589628 4.59687C-0.191756 5.38018 -0.188691 6.64908 0.596468 7.42862L4.96139 11.7623C5.73868 12.534 5.75062 13.7874 4.98817 14.5738L0.564427 19.1364C-0.203837 19.9288 -0.185014 21.1937 0.606488 21.9629L4.54029 25.7857C5.32242 26.5457 6.56929 26.5391 7.34324 25.7707L11.7233 21.422C12.5059 20.645 13.7696 20.6481 14.5484 21.4288L18.8515 25.7426C19.6301 26.5231 20.8936 26.5264 21.6762 25.7498L25.5983 21.8581C26.3892 21.0733 26.3863 19.7936 25.5919 19.0124L21.2261 14.7192C20.4293 13.9356 20.4292 12.6511 21.2259 11.8674L25.7309 7.43566C26.525 6.65446 26.5278 5.37502 25.7372 4.59034L21.6967 0.580353C20.9061 -0.204231 19.6269 -0.191836 18.8517 0.607918L14.5481 5.04784C13.7728 5.84773 12.4933 5.85997 11.7028 5.07507L7.29595 0.69933C6.51341 -0.0776696 5.24961 -0.0746451 4.4708 0.70609Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="1.57597"
          y1="2.24081"
          x2="27.2166"
          y2="20.5843"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.290756" stopColor="#D691F7" />
          <stop offset="1" stopColor="#226CBB" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const Score: FC<{ icon: ReactNode; score: number; scoredBy?: number }> = ({
  icon,
  score,
  scoredBy,
}) => (
  <div className="flex items-center gap-2">
    {icon}
    <div className="flex items-center gap-0.5 text-sm font-bold">
      {score}
      <MaterialSymbolsStarRounded className="text-sm text-yellow-400" />
    </div>
    {!!scoredBy && (
      <span className="text-muted-foreground text-xs tabular-nums">
        {COMPACT_NUMBER.format(scoredBy)}
      </span>
    )}
  </div>
);

const TooltipRow: FC<{ label: string; children: ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex">
    <div className="w-1/4">
      <span className="text-muted-foreground text-sm leading-tight font-medium">
        {label}:
      </span>
    </div>
    <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
  </div>
);

/** Episodes, or volumes and chapters, as far as they are known. */
const progressRows = (item: MediaTooltipItem): [string, ReactNode][] => {
  if (item.data_type === 'anime') {
    if (
      item.media_type === 'movie' ||
      !item.episodes_total ||
      item.episodes_released == null
    ) {
      return [];
    }
    return [
      [
        'Епізоди',
        item.status === 'finished'
          ? item.episodes_total
          : `${item.episodes_released} / ${item.episodes_total}`,
      ],
    ];
  }
  const rows: [string, ReactNode][] = [
    ['Томи', item.volumes],
    ['Розділи', item.chapters],
  ];
  return rows.filter(([, value]) => value);
};

/** The synopsis's paragraphs run together, keeping its links. */
const Synopsis: FC<{ markdown: string }> = ({ markdown }) => {
  // Every link splits into its text and address: [text, label, href, text…].
  const parts = markdown
    .trim()
    .replace(/\s*\n\s*/g, ' ')
    .split(MARKDOWN_LINK);
  return (
    <p className="text-muted-foreground mb-2 line-clamp-4 text-sm leading-relaxed">
      {parts.map((part, index) =>
        index % 3 === 0 ? (
          part
        ) : index % 3 === 1 ? (
          <a
            key={index}
            href={parts[index + 1]}
            {...linkProps}
            className="text-primary hover:underline"
          >
            {part}
          </a>
        ) : null,
      )}
    </p>
  );
};

/** What hikka.io's card for a title shows, for guests. */
const MediaTooltipBody: FC<{ item: MediaTooltipItem }> = ({ item }) => {
  const synopsis = item.synopsis_ua || item.synopsis_en;
  const status = item.status ? STATUSES[item.status] : undefined;
  const hasMal = item.score > 0;
  const hasHikka = item.native_score > 0;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-bold">{hikkaTitle(item)}</h3>
      {(hasMal || hasHikka) && (
        <div className="flex items-center gap-3">
          {hasMal && (
            <Score
              icon={<MalLogo className="text-foreground size-4" />}
              score={item.score}
              scoredBy={item.scored_by}
            />
          )}
          {hasMal && hasHikka && (
            <Separator orientation="vertical" className="h-5" />
          )}
          {hasHikka && (
            <Score
              icon={<HikkaLogo className="size-4 shrink-0" />}
              score={item.native_score}
              scoredBy={item.native_scored_by}
            />
          )}
        </div>
      )}
      {synopsis && <Synopsis markdown={synopsis} />}
      <TooltipRow label="Тип">
        {item.media_type && MEDIA_TYPES[item.media_type] && (
          <span className="text-sm leading-tight font-medium">
            {MEDIA_TYPES[item.media_type]}
          </span>
        )}
        {status && (
          <Badge
            className={cn('rounded-sm border px-1.5 py-0', status.className)}
          >
            {status.title}
          </Badge>
        )}
      </TooltipRow>
      {progressRows(item).map(([label, value]) => (
        <TooltipRow key={label} label={label}>
          <span className="text-sm leading-tight font-medium">{value}</span>
        </TooltipRow>
      ))}
      <TooltipRow label="Жанри">
        <div className="flex-1">
          {item.genres.map((genre, index) => (
            <span key={genre.slug}>
              <a
                href={`https://hikka.io/${item.data_type}?genres=${encodeURIComponent(JSON.stringify([genre.slug]))}`}
                {...linkProps}
                className="decoration-primary hover:bg-primary/15 hover:text-primary text-sm underline decoration-dashed transition-colors duration-100"
              >
                {genre.name_ua}
              </a>
              {index + 1 !== item.genres.length && ', '}
            </span>
          ))}
        </div>
      </TooltipRow>
    </div>
  );
};

interface Props {
  item: MediaTooltipItem;
  /** The feature UI's container, so the card takes its styles. */
  container: HTMLElement;
  /** What opens the card on hover, such as the title's link. */
  children: ReactElement;
}

/** hikka.io's hover card for a title, beside the element it is about. */
const MediaTooltip: FC<Props> = ({ item, container, children }) => (
  <HoverCard>
    <HoverCardTrigger delay={500} closeDelay={100} render={children} />
    <HoverCardContent
      side="right"
      collisionAvoidance={{ fallbackAxisSide: 'none' }}
      container={container}
      className="hidden w-80 flex-col gap-4 text-base md:flex"
    >
      <MediaTooltipBody item={item} />
    </HoverCardContent>
  </HoverCard>
);

export default MediaTooltip;
