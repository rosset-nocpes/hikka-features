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
import { Spinner } from '@/components/ui/spinner';
import { account } from '@/utils/account';
import {
  type CatalogTeam,
  convexApi,
  type PreferredTranslation,
} from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';
import { looseKey } from '@/utils/utils';

import RowDescription from '../_base/row-description';
import SegmentedOption from '../_base/segmented-option';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';

const translationOptions: readonly {
  value: PreferredTranslation;
  label: string;
}[] = [
  { value: 'dub', label: 'Озвучення' },
  { value: 'sub', label: 'Субтитри' },
];

const TeamAvatar = ({ team }: { team: CatalogTeam }) => (
  <Avatar className="size-8 rounded-md">
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
        'before:bg-border/70 relative flex items-center gap-2 py-2 pr-2 pl-1 before:absolute before:inset-x-4 before:top-0 before:h-px first:before:hidden',
        dragging &&
          'bg-accent z-10 rounded-lg shadow-lg ring-1 ring-white/10 before:hidden',
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
      <span className="text-muted-foreground w-4 shrink-0 text-center text-xs font-medium tabular-nums">
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
  const translation = features.player.teamPriorityTranslation;

  // Pick up changes made on other devices.
  useEffect(() => {
    void account.syncTeamPriority();
  }, []);
  const [search, setSearch] = useState('');

  // While dragging, the order lives here and is saved once on drop: saving
  // every swap would let the storage listener reload an older order mid-drag.
  const [draft, setDraft] = useState<CatalogTeam[]>();
  const draftRef = useRef<CatalogTeam[]>(undefined);
  const order = draft ?? saved;

  const catalog = useQuery({
    queryKey: ['catalog-teams'],
    queryFn: () => convex.query(convexApi.teams.list, {}),
    select: (teams) =>
      teams.toSorted((a, b) => a.title.localeCompare(b.title, 'uk')),
    staleTime: Infinity,
  });

  const save = (
    settings: Partial<
      Pick<typeof features.player, 'teamPriority' | 'teamPriorityTranslation'>
    >,
  ) => {
    updateFeatureSettings('player', settings);
    void account.syncTeamPriority();
  };

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= order.length) return;

    const next = [...order];
    const [team] = next.splice(index, 1);
    next.splice(target, 0, team!);
    save({ teamPriority: next });
    // Moving the row in the DOM drops focus; put it back on its handle.
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(`[data-handle="${team!.id}"]`)
        ?.focus(),
    );
  };

  const selected = new Set(order.map((team) => team.id));
  const query = looseKey(search);
  const results = (catalog.data ?? []).filter(
    (team) => !selected.has(team.id) && looseKey(team.title).includes(query),
  );

  return (
    <SettingsPage>
      <SettingsGroup>
        <SegmentedOption
          label="Переклад"
          value={translation}
          options={translationOptions}
          onChange={(value) => save({ teamPriorityTranslation: value })}
        />
      </SettingsGroup>

      <SettingsGroup
        title={order.length ? `Порядок · ${order.length}` : 'Порядок'}
        footer={
          <>
            Програвач відкриється з першою командою, яка вже має наступний
            епізод у вибраному перекладі. Улюблена команда тайтлу має перевагу.{' '}
            {convexSession
              ? 'Список синхронізується з акаунтом, а про нові серії тайтлів зі списку «Дивлюсь» від цих команд з’являться сповіщення на Hikka.'
              : 'Увійдіть, щоб синхронізувати список між пристроями й отримувати сповіщення про нові серії.'}
          </>
        }
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
                  save({
                    teamPriority: order.filter((entry) => entry.id !== team.id),
                  })
                }
                onDragEnd={() => {
                  if (draftRef.current) {
                    save({ teamPriority: draftRef.current });
                  }
                  draftRef.current = undefined;
                  setDraft(undefined);
                }}
              />
            ))}
          </Reorder.Group>
        ) : (
          <div className="flex flex-col items-center gap-1 px-6 py-5 text-center">
            <MaterialSymbolsFormatListNumberedRounded className="text-muted-foreground mb-1 size-6" />
            <span className="text-sm font-medium">Список порожній</span>
            <RowDescription>
              Додайте команди нижче, починаючи з найулюбленішої
            </RowDescription>
          </div>
        )}
      </SettingsGroup>

      <SettingsGroup title="Додати команду">
        <div className="p-2">
          <InputGroup className="bg-muted/40 border-transparent">
            <InputGroupAddon>
              <MaterialSymbolsSearchRounded />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук команди"
              aria-label="Пошук команди"
              className="text-sm"
            />
          </InputGroup>
        </div>
        {catalog.isPending ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 px-4 py-4 text-xs font-medium">
            <Spinner />
            Завантаження команд
          </div>
        ) : catalog.isError ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-destructive text-xs font-medium">
              Не вдалося завантажити команди.
            </span>
            <Button variant="ghost" size="sm" onClick={() => catalog.refetch()}>
              Повторити
            </Button>
          </div>
        ) : results.length ? (
          results.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => save({ teamPriority: [...order, team] })}
              aria-label={`Додати «${team.title}»`}
              className="group/row hover:bg-accent/40 focus-visible:bg-accent/40 flex w-full items-center gap-3 px-4 py-2 text-left transition-[background-color] outline-none"
            >
              <TeamAvatar team={team} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {team.title}
              </span>
              <MaterialSymbolsAddRounded className="text-muted-foreground group-hover/row:text-foreground size-5 shrink-0" />
            </button>
          ))
        ) : (
          <p className="text-muted-foreground px-4 py-4 text-center text-xs">
            {search ? 'Нічого не знайдено' : 'Усі команди вже у списку'}
          </p>
        )}
      </SettingsGroup>
    </SettingsPage>
  );
};

export default TeamPrioritySettings;
