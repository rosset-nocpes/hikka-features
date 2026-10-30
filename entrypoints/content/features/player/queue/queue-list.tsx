import { Reorder, useDragControls } from 'motion/react';
import { type FC, useRef, useState } from 'react';
import MaterialSymbolsAutoplayRounded from '~icons/material-symbols/autoplay-rounded';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsDragIndicator from '~icons/material-symbols/drag-indicator';
import MaterialSymbolsGroupOutlineRounded from '~icons/material-symbols/group-outline-rounded';
import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';
import MaterialSymbolsPlaylistAddRounded from '~icons/material-symbols/playlist-add-rounded';
import MaterialSymbolsPlaylistRemoveRounded from '~icons/material-symbols/playlist-remove-rounded';
import MaterialSymbolsVerticalAlignBottomRounded from '~icons/material-symbols/vertical-align-bottom-rounded';
import MaterialSymbolsVerticalAlignTopRounded from '~icons/material-symbols/vertical-align-top-rounded';

import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import EmptyState from '@/components/ui/empty-state';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useHikkaContent } from '@/hooks/use-hikka';

import { followingEpisode, usePlayer } from '../context/player-context';
import { useWatchTogether } from '../watch-together/use-watch-together';
import QueueNotice, { offerUndo } from './queue-notice';
import { Poster } from './up-next';
import { type ActiveQueue, useActiveQueue } from './use-active-queue';
import { type QueueItem, queueKey, useQueue } from './use-queue';

/** A row's poster, anime and episode. */
const EpisodeSummary: FC<
  Pick<QueueItem, 'slug' | 'episode' | 'team'> & { loading?: boolean }
> = ({ slug, episode, team, loading }) => {
  const { data: anime, isLoading } = useHikkaContent('anime', slug);

  return (
    <>
      <div className="relative shrink-0">
        <Poster src={anime?.image} className="h-10 w-7" />
        {loading && (
          <div className="absolute inset-0 grid place-items-center rounded-sm bg-black/50 text-white">
            <Spinner aria-hidden className="size-4" />
          </div>
        )}
      </div>
      <div className="grid min-w-0 flex-1 gap-0.5 leading-tight">
        {isLoading ? (
          <Skeleton className="h-4 w-3/4" />
        ) : (
          <span className="truncate font-medium">
            {hikkaTitle(anime) ?? slug}
          </span>
        )}
        <span className="text-muted-foreground truncate text-xs">
          Епізод {episode}
          {team && ` · ${team}`}
        </span>
      </div>
    </>
  );
};

interface RowProps {
  item: QueueItem;
  index: number;
  queue: ActiveQueue;
  /** Moves the episode to `index`, keeping its handle focused. */
  onMove: (index: number) => void;
  onDragEnd: () => void;
}

/** A sidebar row, like an episode's, with a drag handle where its number is. */
const QueueRow: FC<RowProps> = ({ item, index, queue, onMove, onDragEnd }) => {
  const { data: anime } = useHikkaContent('anime', item.slug);
  const container = usePlayer((state) => state.container);
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  const key = queueKey(item);
  const loading = useQueue((state) => state.loading === key);

  const title = hikkaTitle(anime) ?? item.slug;
  const name = `«${title}», епізод ${item.episode}`;
  const last = queue.items.length - 1;

  const remove = () => {
    queue.remove(item);
    offerUndo(queue, [item], `Прибрано ${name}`);
  };

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false);
        onDragEnd();
      }}
      data-sidebar="menu-item"
      className={cn(
        'group/menu-item relative rounded-md',
        dragging && 'bg-sidebar z-10 shadow-lg',
      )}
    >
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <SidebarMenuButton
              size="lg"
              title={`${title}, епізод ${item.episode}`}
              aria-busy={loading || undefined}
              // The handle covers the left padding, and hovering it is the row's.
              className="group-hover/menu-item:bg-sidebar-accent py-1 pl-7"
              onClick={() => queue.play(item)}
            />
          }
        >
          <EpisodeSummary {...item} loading={loading} />
        </ContextMenuTrigger>
        <ContextMenuContent container={container}>
          <DropdownMenuItem onClick={() => queue.play(item)}>
            <MaterialSymbolsPlayArrowRounded />
            Грати зараз
          </DropdownMenuItem>
          <DropdownMenuItem disabled={index === 0} onClick={() => onMove(0)}>
            <MaterialSymbolsVerticalAlignTopRounded />
            Грати наступним
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index === last}
            onClick={() => onMove(last)}
          >
            <MaterialSymbolsVerticalAlignBottomRounded />
            Перемістити в кінець
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={remove}>
            <MaterialSymbolsPlaylistRemoveRounded />
            Прибрати з черги
          </DropdownMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <button
        type="button"
        data-handle={key}
        aria-label={`Перемістити ${name}. Стрілки вгору та вниз змінюють позицію, Home і End ставлять першим чи останнім`}
        onPointerDown={(event) => controls.start(event)}
        onKeyDown={(event) => {
          const target = {
            ArrowUp: index - 1,
            ArrowDown: index + 1,
            Home: 0,
            End: last,
          }[event.key];
          if (target === undefined) return;
          event.preventDefault();
          if (target >= 0 && target <= last && target !== index) {
            onMove(target);
          }
        }}
        className="text-muted-foreground group-hover/menu-item:text-sidebar-accent-foreground ring-sidebar-ring absolute top-1/2 left-1 grid h-8 w-5 -translate-y-1/2 cursor-grab touch-none place-items-center rounded-md outline-hidden focus-visible:ring-2 active:cursor-grabbing"
      >
        <MaterialSymbolsDragIndicator className="size-4" />
      </button>
      <SidebarMenuAction
        showOnHover
        aria-label={`Прибрати з черги ${name}`}
        title="Прибрати з черги"
        className="peer-data-[size=lg]/menu-button:top-3.5"
        onClick={remove}
      >
        <MaterialSymbolsCloseRounded />
      </SidebarMenuAction>
    </Reorder.Item>
  );
};

/** The playing episode, with how far into it the player is. */
const NowPlaying = () => {
  const { slug, team, currentEpisode } = usePlayer();
  const progress = useIFramePlayer(({ currentTime, duration }) =>
    duration > 0 ? Math.min(currentTime / duration, 1) : 0,
  );

  if (!slug || !currentEpisode) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Зараз</SidebarGroupLabel>
      <div className="flex items-center gap-2 px-2 py-1 text-sm">
        <EpisodeSummary
          slug={slug}
          episode={currentEpisode.episode}
          team={team?.title ?? ''}
        />
      </div>
      <div
        role="progressbar"
        aria-label="Переглянуто"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        className="bg-sidebar-accent mx-2 mt-1 h-0.5 overflow-hidden rounded-full"
      >
        <div
          className="bg-sidebar-foreground/60 h-full origin-left"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </SidebarGroup>
  );
};

/**
 * The anime's next episode, which plays when the queue is empty, as it would
 * if nothing were queued.
 */
const FollowingEpisode = () => {
  const { slug, team, setEpisode } = usePlayer();
  const following = usePlayer(followingEpisode);
  const shared = useWatchTogether((state) => !!state.room);
  const autoplay = useSettings((state) => state.features.player.autoplayNext);

  if (!slug || !following) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {autoplay || shared ? 'Далі автоматично' : 'Наступний епізод'}
      </SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="py-1"
            onClick={() => setEpisode(following)}
          >
            <EpisodeSummary
              slug={slug}
              episode={following.episode}
              team={team?.title ?? ''}
            />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

/**
 * Whether what follows an episode starts by itself. A watch together room
 * always moves everyone on, so it has none.
 */
export const AutoplaySwitch = () => {
  const shared = useWatchTogether((state) => !!state.room);
  const autoplay = useSettings((state) => state.features.player.autoplayNext);

  if (shared) return null;

  return (
    <SidebarMenuItem>
      <label className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm [&>svg]:size-4 [&>svg]:shrink-0">
        <MaterialSymbolsAutoplayRounded />
        <span className="flex-1 truncate">Автопрогравання</span>
        <Switch
          size="sm"
          checked={autoplay}
          onCheckedChange={(checked) =>
            useSettings
              .getState()
              .updateFeatureSettings('player', { autoplayNext: checked })
          }
        />
      </label>
    </SidebarMenuItem>
  );
};

/**
 * The episodes to play next, in order; a click plays one right away, a right
 * click or long press offers more. In a watch together room, the room's, for
 * every member. Empty, it shows the anime's next episode, which plays
 * instead.
 */
const QueueList: FC<{ nowPlaying?: boolean }> = ({ nowPlaying }) => {
  const queue = useActiveQueue();
  const own = useQueue((state) => state.items);
  const error = useWatchTogether((state) => state.room && state.error);

  // While dragging, the order lives here and is saved once on drop: saving
  // every swap would let the storage listener reload an older order mid-drag.
  const [draft, setDraft] = useState<QueueItem[]>();
  const draftRef = useRef<QueueItem[]>(undefined);
  const listRef = useRef<HTMLUListElement>(null);
  const items = draft ?? queue.items;
  const indexOf = (item: QueueItem, list = items) =>
    list.findIndex((queued) => queueKey(queued) === queueKey(item));

  const move = (item: QueueItem, target: number) => {
    queue.move(item, target);
    // Moving the row in the DOM drops focus; put it back on its handle.
    requestAnimationFrame(() =>
      listRef.current
        ?.querySelector<HTMLElement>(`[data-handle="${queueKey(item)}"]`)
        ?.focus(),
    );
  };

  let content;
  if (!items.length) {
    const empty = queue.shared ? (
      <EmptyState
        size="sm"
        icon={<MaterialSymbolsGroupOutlineRounded />}
        title="Спільна черга порожня"
        description="Епізоди, які тут додасть будь-хто з кімнати, гратимуть для всіх після поточного."
        action={
          own.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => queue.add(own)}
            >
              <MaterialSymbolsPlaylistAddRounded className="size-4" />
              Додати мою чергу
              <span className="text-muted-foreground tabular-nums">
                {own.length}
              </span>
            </Button>
          )
        }
        className="py-8"
      />
    ) : (
      <EmptyState
        size="sm"
        icon={<MaterialSymbolsPlaylistAddRounded />}
        title="Черга порожня"
        description={
          <>
            Додавайте епізоди будь-яких аніме кнопкою{' '}
            <MaterialSymbolsPlaylistAddRounded className="inline size-4 align-text-bottom" />{' '}
            у списку епізодів або на сторінці аніме. Вони гратимуть після
            поточного.
          </>
        }
        className="py-8"
      />
    );
    content = (
      <>
        <FollowingEpisode />
        {empty}
      </>
    );
  } else {
    content = (
      <SidebarGroup>
        <div className="flex items-center justify-between">
          {queue.shared ? (
            <SidebarGroupLabel className="gap-1.5">
              <MaterialSymbolsGroupOutlineRounded />
              Спільна черга
            </SidebarGroupLabel>
          ) : (
            <SidebarGroupLabel>Далі</SidebarGroupLabel>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent h-7 text-xs"
            onClick={() => {
              queue.clear();
              offerUndo(queue, queue.items, 'Чергу очищено', true);
            }}
          >
            Очистити
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-destructive px-2 pb-1 text-xs">
            {error}
          </p>
        )}
        <Reorder.Group
          ref={listRef}
          axis="y"
          values={items}
          onReorder={(next: QueueItem[]) => {
            draftRef.current = next;
            setDraft(next);
          }}
          data-sidebar="menu"
          className="flex w-full min-w-0 flex-col gap-1"
        >
          {items.map((item, index) => (
            <QueueRow
              key={queueKey(item)}
              item={item}
              index={index}
              queue={queue}
              onMove={(target) => move(item, target)}
              onDragEnd={() => {
                const index = draftRef.current
                  ? indexOf(item, draftRef.current)
                  : -1;
                if (index !== -1 && index !== indexOf(item, queue.items)) {
                  queue.move(item, index);
                }
                draftRef.current = undefined;
                setDraft(undefined);
              }}
            />
          ))}
        </Reorder.Group>
      </SidebarGroup>
    );
  }

  return (
    <>
      {nowPlaying && <NowPlaying />}
      {content}
      <QueueNotice shared={queue.shared} />
    </>
  );
};

export default QueueList;
