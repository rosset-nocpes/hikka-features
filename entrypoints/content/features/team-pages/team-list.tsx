import { useQuery } from '@tanstack/react-query';
import { type FC, useDeferredValue, useMemo, useState } from 'react';
import MaterialSymbolsArrowForwardRounded from '~icons/material-symbols/arrow-forward-rounded';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsGroupsOutlineRounded from '~icons/material-symbols/groups-outline-rounded';
import MaterialSymbolsSearchRounded from '~icons/material-symbols/search-rounded';

import TeamLogo from '@/components/hikka/team-logo';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { convexApi, type TeamListing } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';
import { onHikkaLinkClick, teamPagePath } from '@/utils/hikka-router';

import {
  type ContentsEntry,
  ContentsLayout,
  ContentsSection,
} from './contents';
import {
  LoadMoreButton,
  Poster,
  SortSelect,
  type TypeFilter,
  TypeFilterButtons,
  useDocumentTitle,
} from './parts';

/** Teams a part shows at first and adds by each "show more". */
const PAGE_SIZE = 6;
/** Posters before the tile that opens the team. */
const POSTERS = 4;

type Sort = 'releases' | 'title';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'releases', label: 'За кількістю робіт' },
  { value: 'title', label: 'За назвою' },
];

const sorters: Record<Sort, (a: TeamListing, b: TeamListing) => number> = {
  releases: (a, b) => (b.stats?.anime ?? 0) - (a.stats?.anime ?? 0),
  title: (a, b) => a.title.localeCompare(b.title, 'uk'),
};

/** The list's parts, by how active the catalog says a team is. */
const ACTIVITY_GROUPS: (ContentsEntry & { activities: string[] })[] = [
  { id: 'active', title: 'Активні', activities: ['Активна'] },
  { id: 'slow', title: 'Малоактивні', activities: ['Малоактивна'] },
  { id: 'inactive', title: 'Неактивні', activities: ['Неактивна'] },
  {
    id: 'closed',
    title: 'Припинили роботу',
    activities: ['Припинено', 'Розформована'],
  },
];
const OTHER_GROUP = { id: 'other', title: 'Інші' };

const groupOf = (team: TeamListing) =>
  ACTIVITY_GROUPS.find((group) =>
    group.activities.includes(team.activity ?? ''),
  ) ?? OTHER_GROUP;

/** Whether a team's name has the query in it, in either alphabet. */
const matchesSearch = (title: string, query: string) => {
  if (!query) return true;
  if (looseKey(title).includes(looseKey(query))) return true;
  const latin = latinKey(query);
  return !!latin && latinKey(title).includes(latin);
};

/** The last tile of a team's posters: how many it has, opening its page. */
const MoreTile: FC<{ href: string; image?: string; count: number }> = ({
  href,
  image,
  count,
}) => (
  <a
    href={href}
    onClick={onHikkaLinkClick}
    aria-label={`Усі ${count} аніме`}
    className="group/more"
  >
    <Poster image={image} className="[&_svg]:hidden">
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col p-2 text-white sm:p-3">
        <div className="flex items-center justify-between gap-1">
          <span className="text-lg leading-6 font-bold tabular-nums sm:text-2xl sm:leading-8">
            {count}
          </span>
          <MaterialSymbolsArrowForwardRounded className="size-4 shrink-0 text-white/70 transition-transform group-hover/more:translate-x-0.5 group-hover/more:text-white sm:size-5" />
        </div>
        <span className="truncate text-xs leading-4 text-white/70">аніме</span>
      </div>
    </Poster>
  </a>
);

/** A team as hikka.io lists a collection: who, then a strip of posters. */
const TeamRow: FC<{ team: TeamListing }> = ({ team }) => {
  const href = teamPagePath(team.slug);
  const count = team.stats?.anime ?? 0;
  const posters = team.covers.slice(0, POSTERS);
  return (
    <article className="flex flex-col gap-4 py-6 first:pt-0">
      <div className="flex items-center gap-3">
        <a href={href} onClick={onHikkaLinkClick} tabIndex={-1}>
          <TeamLogo title={team.title} logo={team.logo} className="size-12" />
        </a>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <a
            href={href}
            onClick={onHikkaLinkClick}
            className="truncate text-lg leading-7 font-semibold hover:underline"
          >
            {team.title}
          </a>
          <span className="text-muted-foreground truncate text-sm">
            {[...team.kinds, `${count} аніме`].join(' · ')}
          </span>
        </div>
      </div>
      {team.description && (
        <p className="text-muted-foreground line-clamp-2 text-sm leading-5">
          {team.description}
        </p>
      )}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 sm:gap-4">
        {posters.map((cover, index) => (
          <a
            key={cover}
            href={href}
            onClick={onHikkaLinkClick}
            tabIndex={-1}
            className={cn(index === POSTERS - 1 && 'max-sm:hidden')}
          >
            <Poster image={cover} />
          </a>
        ))}
        {count > posters.length && (
          <MoreTile href={href} image={team.covers[POSTERS]} count={count} />
        )}
      </div>
    </article>
  );
};

const TeamRowSkeleton = () => (
  <div className="flex flex-col gap-4 py-6 first:pt-0">
    <div className="flex items-center gap-3">
      <Skeleton className="size-12 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 sm:gap-4">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'aspect-[0.7] w-full rounded-md',
            index === 4 && 'max-sm:hidden',
          )}
        />
      ))}
    </div>
  </div>
);

/** One part of the list, a few teams at first. */
const TeamGroup: FC<ContentsEntry & { teams: TeamListing[] }> = ({
  teams,
  ...entry
}) => {
  const [shown, setShown] = useState(PAGE_SIZE);
  return (
    <ContentsSection {...entry}>
      <div className="divide-border flex flex-col divide-y">
        {teams.slice(0, shown).map((team) => (
          <TeamRow key={team.id} team={team} />
        ))}
      </div>
      {teams.length > shown && (
        <LoadMoreButton onClick={() => setShown(shown + PAGE_SIZE * 2)} />
      )}
    </ContentsSection>
  );
};

/**
 * Every team with releases, like mikai.me/teams, laid out as a hikka.io
 * collection: parts by how active the teams are, listed in the contents.
 */
const TeamList = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<Sort>('releases');
  const query = useDeferredValue(search.trim());
  useDocumentTitle('Команди');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['team-list'],
    queryFn: () => convex.query(convexApi.fandub.teams, {}),
    staleTime: 5 * 60_000,
    retry: false,
  });
  // Teams the catalogs know of but have no releases for aren't listed.
  const teams = useMemo(
    () => (data ?? []).filter((team) => (team.stats?.anime ?? 0) > 0),
    [data],
  );
  const counts = useMemo(
    () => ({
      all: teams.length,
      dub: teams.filter((team) => (team.stats?.dub ?? 0) > 0).length,
      sub: teams.filter((team) => (team.stats?.sub ?? 0) > 0).length,
    }),
    [teams],
  );
  const groups = useMemo(() => {
    const visible = teams
      .filter(
        (team) =>
          (filter === 'all' || (team.stats?.[filter] ?? 0) > 0) &&
          matchesSearch(team.title, query),
      )
      .toSorted(sorters[sort]);
    return [...ACTIVITY_GROUPS, OTHER_GROUP].flatMap(({ id, title }) => {
      const members = visible.filter((team) => groupOf(team).id === id);
      return members.length
        ? [{ id, title, count: members.length, teams: members }]
        : [];
    });
  }, [teams, filter, sort, query]);

  return (
    <ContentsLayout
      entries={groups}
      bar={
        data && (
          <TypeFilterButtons
            value={filter}
            counts={counts}
            onChange={setFilter}
          />
        )
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl leading-8 font-bold">
            Команди
            {data && (
              <span className="text-muted-foreground ml-1.5 font-medium tabular-nums">
                {teams.length}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm leading-6">
            Українські команди озвучення та субтитрів. Релізи зібрано з їхніх
            Telegram-каналів, каталогу CPR і плеєрів.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <MaterialSymbolsSearchRounded className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Назва команди..."
              aria-label="Назва команди"
              className="h-10 rounded-lg pr-11 pl-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Очистити"
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-1 -translate-y-1/2"
              >
                <MaterialSymbolsCloseRounded />
              </Button>
            )}
          </div>
          <SortSelect
            options={SORTS}
            value={sort}
            onChange={setSort}
            className="w-full sm:w-52"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="divide-border flex flex-col divide-y">
          {Array.from({ length: 3 }, (_, index) => (
            <TeamRowSkeleton key={index} />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="flex flex-col gap-12">
          {groups.map((group) => (
            // A new search or filter starts each part short again.
            <TeamGroup key={`${group.id}:${query}:${filter}`} {...group} />
          ))}
        </div>
      ) : (
        <EmptyState
          bordered
          icon={<MaterialSymbolsGroupsOutlineRounded />}
          title={
            isError ? 'Не вдалося завантажити команди' : 'Команд не знайдено'
          }
          description={
            isError
              ? 'Спробуйте, будь ласка, пізніше'
              : 'Спробуйте іншу назву або інший фільтр'
          }
        />
      )}
    </ContentsLayout>
  );
};

export default TeamList;
