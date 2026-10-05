import { useQuery } from '@tanstack/react-query';
import { Reorder, useDragControls } from 'motion/react';
import { type FC, useEffect, useRef, useState } from 'react';
import MaterialSymbolsAddRounded from '~icons/material-symbols/add-rounded';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsDragIndicator from '~icons/material-symbols/drag-indicator';
import MaterialSymbolsFormatListNumberedRounded from '~icons/material-symbols/format-list-numbered-rounded';
import MaterialSymbolsSearchRounded from '~icons/material-symbols/search-rounded';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { type CatalogTeam, convexApi } from '@/utils/convex-api';
import { publicQuery } from '@/utils/convex-client';
import { queueTeamPrioritySync } from '@/utils/team-priority-sync';

import SettingsGroup from '../_base/settings-group';

const normalize = (value: string) =>
  value.toLocaleLowerCase('uk').replace(/\s+/g, '');

const TeamAvatar = ({ team }: { team: CatalogTeam }) => (
  <Avatar className="size-8 rounded-md after:rounded-md">
    {team.logo && <AvatarImage src={team.logo} alt="" />}
    <AvatarFallback className="rounded-md text-xs">
      {team.title[0]}
    </AvatarFallback>
  </Avatar>
);

interface RowProps {
  team: CatalogTeam;
  index: number;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
  onDragEnd: () => void;
}

const PriorityRow: FC<RowProps> = ({
  team,
  index,
  onMove,
  onRemove,
  onDragEnd,
}) => {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);

  return (
    <Reorder.Item
      value={team}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false);
        onDragEnd();
      }}
      className={cn(
        'border-border/50 relative flex items-center gap-3 border-t py-2 pr-2 pl-2 first:border-t-0',
        dragging &&
          'bg-background z-10 rounded-md border-transparent shadow-lg',
      )}
    >
      <button
        type="button"
        data-handle={team.id}
        aria-label={`Перемістити «${team.title}». Стрілки вгору та вниз змінюють позицію`}
        onPointerDown={(event) => controls.start(event)}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
          event.preventDefault();
          onMove(event.key === 'ArrowUp' ? -1 : 1);
        }}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md outline-none focus-visible:ring-2 active:cursor-grabbing"
      >
        <MaterialSymbolsDragIndicator className="size-5" />
      </button>
      <span className="text-muted-foreground w-3 shrink-0 text-center text-xs tabular-nums">
        {index + 1}
      </span>
      <TeamAvatar team={team} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {team.title}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Прибрати «${team.title}»`}
        className="text-muted-foreground"
        onClick={onRemove}
      >
        <MaterialSymbolsCloseRounded />
      </Button>
    </Reorder.Item>
  );
};

const TeamPrioritySettings = () => {
  const { features, updateFeatureSettings, convexSession } = useSettings();
  const saved = features.player.teamPriority;

  // Pick up changes made on other devices.
  useEffect(() => {
    queueTeamPrioritySync();
  }, []);
  const [search, setSearch] = useState('');

  // While dragging, the order lives here and is saved once on drop: saving
  // every swap would let the storage listener reload an older order mid-drag.
  const [draft, setDraft] = useState<CatalogTeam[]>();
  const draftRef = useRef<CatalogTeam[]>(undefined);
  const order = draft ?? saved;

  const catalog = useQuery({
    queryKey: ['catalog-teams'],
    queryFn: () => publicQuery(convexApi.teams.list, {}),
    select: (teams) =>
      teams.toSorted((a, b) => a.title.localeCompare(b.title, 'uk')),
    staleTime: Infinity,
  });

  const save = (teamPriority: CatalogTeam[]) => {
    updateFeatureSettings('player', { teamPriority });
    queueTeamPrioritySync();
  };

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= order.length) return;

    const next = [...order];
    const [team] = next.splice(index, 1);
    next.splice(target, 0, team!);
    save(next);
    // Moving the row in the DOM drops focus; put it back on its handle.
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(`[data-handle="${team!.id}"]`)
        ?.focus(),
    );
  };

  const selected = new Set(order.map((team) => team.id));
  const query = normalize(search);
  const results = (catalog.data ?? []).filter(
    (team) => !selected.has(team.id) && normalize(team.title).includes(query),
  );

  return (
    <ScrollArea className="h-full" scrollFade>
      <div className="flex flex-col gap-3 pb-4">
        <p className="px-1 text-xs font-medium text-pretty text-[#A1A1A1]">
          Програвач відкриється з першою командою зі списку, яка вже має
          наступний епізод. Улюблена команда тайтлу має перевагу над списком.{' '}
          {convexSession
            ? 'Список синхронізується з акаунтом.'
            : 'Увійдіть, щоб синхронізувати його між пристроями.'}
        </p>

        <SettingsGroup
          title="Порядок"
          icon={<MaterialSymbolsFormatListNumberedRounded className="size-4" />}
        >
          {order.length ? (
            <Reorder.Group
              axis="y"
              values={order}
              onReorder={(next: CatalogTeam[]) => {
                draftRef.current = next;
                setDraft(next);
              }}
              className="flex flex-col"
            >
              {order.map((team, index) => (
                <PriorityRow
                  key={team.id}
                  team={team}
                  index={index}
                  onMove={(offset) => move(index, offset)}
                  onRemove={() =>
                    save(order.filter((entry) => entry.id !== team.id))
                  }
                  onDragEnd={() => {
                    if (draftRef.current) save(draftRef.current);
                    draftRef.current = undefined;
                    setDraft(undefined);
                  }}
                />
              ))}
            </Reorder.Group>
          ) : (
            <p className="px-4 py-3 text-xs font-medium text-[#A1A1A1]">
              Список порожній. Додайте команди нижче, починаючи з
              найулюбленішої.
            </p>
          )}
        </SettingsGroup>

        <SettingsGroup
          title="Додати команду"
          icon={<MaterialSymbolsAddRounded className="size-4" />}
        >
          <div className="p-3">
            <InputGroup>
              <InputGroupAddon>
                <MaterialSymbolsSearchRounded />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Пошук команди"
                aria-label="Пошук команди"
              />
            </InputGroup>
          </div>
          {catalog.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium">
              <Spinner />
              Завантаження команд
            </div>
          ) : catalog.isError ? (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-destructive text-xs font-medium">
                Не вдалося завантажити команди.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => catalog.refetch()}
              >
                Повторити
              </Button>
            </div>
          ) : results.length ? (
            results.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => save([...order, team])}
                className="group/row hover:bg-accent/30 flex w-full items-center gap-3 px-4 py-2 text-left transition-[background-color]"
              >
                <TeamAvatar team={team} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {team.title}
                </span>
                <MaterialSymbolsAddRounded className="text-muted-foreground group-hover/row:text-foreground size-5 shrink-0" />
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-xs font-medium text-[#A1A1A1]">
              {search ? 'Нічого не знайдено.' : 'Усі команди вже у списку.'}
            </p>
          )}
        </SettingsGroup>
      </div>
    </ScrollArea>
  );
};

export default TeamPrioritySettings;
