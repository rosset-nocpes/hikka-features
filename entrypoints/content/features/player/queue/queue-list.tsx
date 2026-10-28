import { Reorder, useDragControls } from 'motion/react';
import { type FC, useRef, useState } from 'react';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsDragIndicator from '~icons/material-symbols/drag-indicator';
import MaterialSymbolsGroupOutlineRounded from '~icons/material-symbols/group-outline-rounded';
import MaterialSymbolsPlaylistAddRounded from '~icons/material-symbols/playlist-add-rounded';

import { Button } from '@/components/ui/button';
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
import { useHikkaContent } from '@/hooks/use-hikka';

import { followingEpisode, usePlayer } from '../context/player-context';
import { useWatchTogether } from '../watch-together/use-watch-together';
import { useActiveQueue } from './use-active-queue';
import { type QueueItem, queueKey, useQueue } from './use-queue';

interface RowProps {
  item: QueueItem;
  onPlay: () => void;
  onRemove: () => void;
  onMove: (offset: -1 | 1) => void;
  onDragEnd: () => void;
}

/** A row's poster, anime and episode. */
const EpisodeSummary: FC<Pick<QueueItem, 'slug' | 'episode' | 'team'>> = ({
  slug,
  episode,
  team,
}) => {
  const { data: anime, isLoading } = useHikkaContent('anime', slug);

  return (
    <>
      <div className="bg-muted border-overlay h-10 w-7 shrink-0 overflow-hidden rounded-sm">
        {anime?.image && (
          <img
            src={anime.image}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
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

/** A sidebar row, like an episode's, with a drag handle where its number is. */
const QueueRow: FC<RowProps> = ({
  item,
  onPlay,
  onRemove,
  onMove,
  onDragEnd,
}) => {
  const { data: anime } = useHikkaContent('anime', item.slug);
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);

  const title = hikkaTitle(anime) ?? item.slug;
  const key = queueKey(item);

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
      <SidebarMenuButton
        size="lg"
        title={`${title}, епізод ${item.episode}`}
        // The handle covers the left padding, and hovering it is the row's.
        className="group-hover/menu-item:bg-sidebar-accent py-1 pl-7"
        onClick={onPlay}
      >
        <EpisodeSummary {...item} />
      </SidebarMenuButton>
      <button
        type="button"
        data-handle={key}
        aria-label={`Перемістити «${title}», епізод ${item.episode}. Стрілки вгору та вниз змінюють позицію`}
        onPointerDown={(event) => controls.start(event)}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
          event.preventDefault();
          onMove(event.key === 'ArrowUp' ? -1 : 1);
        }}
        className="text-muted-foreground group-hover/menu-item:text-sidebar-accent-foreground ring-sidebar-ring absolute top-1/2 left-1 grid h-8 w-5 -translate-y-1/2 cursor-grab touch-none place-items-center rounded-md outline-hidden focus-visible:ring-2 active:cursor-grabbing"
      >
        <MaterialSymbolsDragIndicator className="size-4" />
      </button>
      <SidebarMenuAction
        showOnHover
        aria-label={`Прибрати з черги «${title}», епізод ${item.episode}`}
        title="Прибрати з черги"
        className="peer-data-[size=lg]/menu-button:top-3.5"
        onClick={onRemove}
      >
        <MaterialSymbolsCloseRounded />
      </SidebarMenuAction>
    </Reorder.Item>
  );
};

/**
 * The anime's next episode, which plays when the queue is empty, as it would
 * if nothing were queued.
 */
const FollowingEpisode = () => {
  const { slug, team, setEpisode } = usePlayer();
  const following = usePlayer(followingEpisode);

  if (!slug || !following) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Далі автоматично</SidebarGroupLabel>
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
 * The episodes to play next, in order; a click plays one right away. In a
 * watch together room, the room's, for every member. Empty, it shows the
 * anime's next episode, which plays instead.
 */
const QueueList = () => {
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

  const move = (item: QueueItem, offset: -1 | 1) => {
    const target = indexOf(item) + offset;
    if (target < 0 || target >= items.length) return;

    queue.move(item, target);
    // Moving the row in the DOM drops focus; put it back on its handle.
    requestAnimationFrame(() =>
      listRef.current
        ?.querySelector<HTMLElement>(`[data-handle="${queueKey(item)}"]`)
        ?.focus(),
    );
  };

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
    return (
      <>
        <FollowingEpisode />
        {empty}
      </>
    );
  }

  return (
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
          onClick={queue.clear}
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
        {items.map((item) => (
          <QueueRow
            key={queueKey(item)}
            item={item}
            onPlay={() => queue.play(item)}
            onRemove={() => queue.remove(item)}
            onMove={(offset) => move(item, offset)}
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
};

export default QueueList;
