import { useQuery } from '@tanstack/react-query';
import { type FC, useMemo, useState } from 'react';
import MaterialSymbolsGroupOffOutlineRounded from '~icons/material-symbols/group-off-outline-rounded';
import MaterialSymbolsLanguage from '~icons/material-symbols/language';
import MaterialSymbolsMicOutlineRounded from '~icons/material-symbols/mic-outline-rounded';
import MaterialSymbolsPlayCircleOutlineRounded from '~icons/material-symbols/play-circle-outline-rounded';
import MaterialSymbolsSubtitlesOutlineRounded from '~icons/material-symbols/subtitles-outline-rounded';
import MaterialSymbolsVolunteerActivismOutlineRounded from '~icons/material-symbols/volunteer-activism-outline-rounded';
import MdiInstagram from '~icons/mdi/instagram';
import MdiTelegram from '~icons/mdi/telegram';
import MdiYoutube from '~icons/mdi/youtube';

import { CardMeta, POSTER_GRID, Poster } from '@/components/hikka/poster';
import TeamLogo from '@/components/hikka/team-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  convexApi,
  type TeamLinkKind,
  type TeamPage as TeamPageData,
  type TranslationType,
} from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';
import { onHikkaLinkClick, teamPagePath } from '@/utils/hikka-router';
import {
  MEDIA_TYPE_LABELS,
  releaseProgress,
  TRANSLATION_LABELS,
} from '@/utils/team-releases';

import {
  type ContentsEntry,
  ContentsLayout,
  ContentsSection,
} from './contents';
import { TextExpand, type TypeFilter, TypeFilterButtons } from './parts';

type Team = TeamPageData['team'];
type AnimeReleases = TeamPageData['releases'][number];

/** Releases still coming out, if the team posted one this long ago. */
const ONGOING_MS = 90 * 24 * 60 * 60 * 1_000;

const TikTokIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      fill="currentColor"
      d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17c1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97c-.57-.26-1.1-.59-1.62-.93c-.01 2.92.01 5.84-.02 8.75c-.08 1.4-.54 2.79-1.35 3.94c-1.31 1.92-3.58 3.17-5.91 3.21c-1.43.08-2.86-.31-4.08-1.03c-2.02-1.19-3.44-3.37-3.65-5.71c-.02-.5-.03-1-.01-1.49c.18-1.9 1.12-3.72 2.58-4.96c1.66-1.44 3.98-2.13 6.15-1.72c.02 1.48-.04 2.96-.04 4.44c-.99-.32-2.15-.23-3.02.37c-.63.41-1.11 1.04-1.36 1.75c-.21.51-.15 1.07-.14 1.61c.24 1.64 1.82 3.02 3.5 2.87c1.12-.01 2.19-.66 2.77-1.61c.19-.33.4-.67.41-1.06c.1-1.79.06-3.57.07-5.36c.01-4.03-.01-8.05.02-12.07"
    />
  </svg>
);

const LINK_ICONS: Record<TeamLinkKind, FC<{ className?: string }>> = {
  telegram: MdiTelegram,
  youtube: MdiYoutube,
  instagram: MdiInstagram,
  tiktok: TikTokIcon,
  website: MaterialSymbolsLanguage,
  donate: MaterialSymbolsVolunteerActivismOutlineRounded,
  anitube: MaterialSymbolsPlayCircleOutlineRounded,
};

const linkLabel = (kind: TeamLinkKind, url: string) => {
  const handle = url.match(/t\.me\/([\w]+)/u)?.[1];
  switch (kind) {
    case 'telegram':
      return handle ? `@${handle}` : 'Telegram';
    case 'youtube':
      return 'YouTube';
    case 'instagram':
      return 'Instagram';
    case 'tiktok':
      return 'TikTok';
    case 'donate':
      return 'Підтримати';
    case 'anitube':
      return 'AniTube';
    case 'website':
      try {
        return new URL(url).hostname.replace(/^www\./u, '');
      } catch {
        return 'Сайт';
      }
  }
};

/** Outline pills like a hikka.io profile's links. */
const TeamLinks: FC<{ links: Team['links'] }> = ({ links }) =>
  links.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {links.map(({ kind, url }) => {
        const Icon = LINK_ICONS[kind];
        return (
          <Button
            key={url}
            variant="outline"
            size="sm"
            className="px-2.5"
            render={<a href={url} target="_blank" rel="noopener noreferrer" />}
          >
            <Icon />
            <span className="max-w-40 truncate">{linkLabel(kind, url)}</span>
          </Button>
        );
      })}
    </div>
  );

/** The page's title block, as a collection's: name, badges, description. */
const TeamHeader: FC<{ team: Team }> = ({ team }) => (
  <div className="flex flex-col gap-6">
    <div className="flex items-center gap-4">
      <TeamLogo
        title={team.title}
        logo={team.logo}
        className="size-20 text-2xl md:size-24 md:text-3xl"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="text-2xl leading-8 font-bold break-words">
          {team.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {team.kinds.map((kind) => (
            <Badge key={kind} variant="secondary">
              {kind}
            </Badge>
          ))}
          {team.activity && <Badge variant="outline">{team.activity}</Badge>}
          {team.stats && (
            <span className="text-muted-foreground text-sm tabular-nums">
              {team.stats.anime} аніме
            </span>
          )}
        </div>
      </div>
    </div>
    {team.description && (
      <TextExpand className="text-sm leading-6">{team.description}</TextExpand>
    )}
    <TeamLinks links={team.links} />
  </div>
);

const TRANSLATION_ICONS: Record<TranslationType, FC<{ className?: string }>> = {
  dub: MaterialSymbolsMicOutlineRounded,
  sub: MaterialSymbolsSubtitlesOutlineRounded,
  unknown: MaterialSymbolsPlayCircleOutlineRounded,
};

/** An anime's poster card with what the team released of it. */
const ReleaseCard: FC<{ entry: AnimeReleases }> = ({ entry }) => {
  const { anime, releases } = entry;
  return (
    <a
      href={`/anime/${anime.slug}`}
      onClick={onHikkaLinkClick}
      className="group relative flex w-full flex-col gap-2"
    >
      <Poster image={anime.image}>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/70 to-transparent" />
        <div className="absolute inset-x-2 bottom-2 flex flex-col items-start gap-1">
          {releases.map((release) => {
            const Icon = TRANSLATION_ICONS[release.translationType];
            const label = TRANSLATION_LABELS[release.translationType];
            const progress = releaseProgress(release, anime.episodesTotal);
            return (
              <span
                key={release.translationType}
                title={[label, progress].filter(Boolean).join(' ')}
                className="inline-flex max-w-full items-center gap-1 rounded-sm bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate tabular-nums">
                  {progress ?? label}
                </span>
              </span>
            );
          })}
        </div>
      </Poster>
      <div className="flex flex-col gap-1">
        <span className="line-clamp-2 text-sm leading-5 font-medium group-hover:underline">
          {anime.title ?? anime.slug}
        </span>
        <CardMeta
          items={[
            anime.mediaType && MEDIA_TYPE_LABELS[anime.mediaType],
            anime.year?.toString(),
          ]}
        />
      </div>
    </a>
  );
};

const has = (entry: AnimeReleases, type: 'dub' | 'sub') =>
  entry.releases.some((release) => release.translationType === type);

interface ReleaseGroup extends ContentsEntry {
  /** Groups come in descending order of this. */
  order: number;
  entries: AnimeReleases[];
}

/** The anime's years as a team page's parts: each year, then by decade. */
const yearGroup = (year: number | undefined) => {
  if (!year) return { id: 'unknown', title: 'Рік невідомий', order: 0 };
  if (year >= 2010) return { id: `${year}`, title: `${year} рік`, order: year };
  if (year >= 1990) {
    const decade = year - (year % 10);
    return { id: `${decade}s`, title: `${decade}-ті роки`, order: decade };
  }
  return { id: 'earlier', title: 'До 1990 року', order: 1 };
};

/**
 * A team's releases in parts, like a collection's groups: what's still
 * coming out, then the rest by the anime's year; newest releases first.
 */
function groupReleases(entries: AnimeReleases[], now: number) {
  const groups = new Map<string, ReleaseGroup>();
  for (const entry of entries) {
    const ongoing =
      now - entry.updatedAt < ONGOING_MS &&
      entry.releases.some((release) => release.status === 'ongoing');
    const group = ongoing
      ? { id: 'ongoing', title: 'Виходить', order: Infinity }
      : yearGroup(entry.anime.year);
    const current = groups.get(group.id) ?? { ...group, entries: [] };
    current.entries.push(entry);
    groups.set(group.id, current);
  }
  return [...groups.values()]
    .sort((left, right) => right.order - left.order)
    .map((group) => ({
      ...group,
      count: group.entries.length,
      entries: group.entries.toSorted(
        (left, right) => right.updatedAt - left.updatedAt,
      ),
    }));
}

const TeamPageSkeleton = () => (
  <ContentsLayout entries={[]}>
    <div className="flex items-center gap-4">
      <Skeleton className="size-20 rounded-lg md:size-24" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
    <div className={POSTER_GRID}>
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="aspect-[0.7] w-full rounded-md" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  </ContentsLayout>
);

/**
 * A team's page, laid out as a hikka.io collection: who they are, then
 * everything they released in parts listed in the contents beside it.
 */
const TeamPage: FC<{ slug: string }> = ({ slug }) => {
  const [filter, setFilter] = useState<TypeFilter>('all');
  // What counts as still coming out is decided once a visit.
  const [now] = useState(Date.now);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['team-page', slug],
    queryFn: () => convex.query(convexApi.fandub.team, { slug }),
    staleTime: 60_000,
    retry: false,
  });
  useDocumentTitle(
    data?.team.title ?? (data === null ? 'Команду не знайдено' : undefined),
  );

  const releases = data?.releases;
  const groups = useMemo(
    () =>
      groupReleases(
        (releases ?? []).filter(
          (entry) => filter === 'all' || has(entry, filter),
        ),
        now,
      ),
    [releases, filter, now],
  );
  const counts = useMemo(
    () => ({
      all: releases?.length ?? 0,
      dub: releases?.filter((entry) => has(entry, 'dub')).length ?? 0,
      sub: releases?.filter((entry) => has(entry, 'sub')).length ?? 0,
    }),
    [releases],
  );

  if (isLoading) return <TeamPageSkeleton />;
  if (!data) {
    return (
      <EmptyState
        bordered
        size="lg"
        icon={<MaterialSymbolsGroupOffOutlineRounded />}
        title={
          isError ? 'Не вдалося завантажити команду' : 'Команду не знайдено'
        }
        description={
          isError
            ? 'Спробуйте, будь ласка, пізніше'
            : 'Можливо, її перейменували або вона ще не в каталозі'
        }
        action={
          <Button
            variant="outline"
            size="md"
            render={<a href={teamPagePath()} onClick={onHikkaLinkClick} />}
          >
            Усі команди
          </Button>
        }
      />
    );
  }

  return (
    <ContentsLayout
      entries={groups}
      bar={
        counts.all > 0 && (
          <TypeFilterButtons
            value={filter}
            counts={counts}
            onChange={setFilter}
          />
        )
      }
    >
      <TeamHeader team={data.team} />
      {groups.length > 0 ? (
        <div className="flex flex-col gap-12">
          {groups.map(({ id, title, count, entries }) => (
            <ContentsSection key={id} id={id} title={title} count={count}>
              <div className={POSTER_GRID}>
                {entries.map((entry) => (
                  <ReleaseCard key={entry.anime.slug} entry={entry} />
                ))}
              </div>
            </ContentsSection>
          ))}
        </div>
      ) : (
        <EmptyState
          bordered
          icon={<MaterialSymbolsMicOutlineRounded />}
          title="Релізів не знайдено"
          description={
            counts.all > 0
              ? 'Команда ще нічого не випустила з цього'
              : 'Ми ще не знаємо, що випустила команда'
          }
        />
      )}
    </ContentsLayout>
  );
};

export default TeamPage;
