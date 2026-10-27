import { Reorder, useDragControls } from 'motion/react';
import { type FC, useRef, useState } from 'react';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsDragIndicator from '~icons/material-symbols/drag-indicator';
import MaterialSymbolsPlaylistAddRounded from '~icons/material-symbols/playlist-add-rounded';

import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuAction,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useHikkaContent } from '@/hooks/use-hikka';

import { playQueued } from '../player';
import { type QueueItem, queueKey, useQueue } from './use-queue';

interface RowProps {
  item: QueueItem;
  onMove: (offset: -1 | 1) => void;
  onDragEnd: () => void;
}

/** A sidebar row, like an episode's, with a drag handle where its number is. */
const QueueRow: FC<RowProps> = ({ item, onMove, onDragEnd }) => {
  const { data: anime, isLoading } = useHikkaContent('anime', item.slug);
  const remove = useQueue((state) => state.remove);
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
        onClick={() => void playQueued(item)}
      >
        <div className="bg-muted h-10 w-7 shrink-0 overflow-hidden rounded-sm">
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
            <span className="truncate font-medium">{title}</span>
          )}
          <span className="text-muted-foreground truncate text-xs">
            Епізод {item.episode}
            {item.team && ` · ${item.team}`}
          </span>
        </div>
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
        onClick={() => remove(item)}
      >
        <MaterialSymbolsCloseRounded />
      </SidebarMenuAction>
    </Reorder.Item>
  );
};

/** The episodes to play next, in order; a click plays one right away. */
const QueueList = () => {
  const { items: saved, setItems, clear } = useQueue();

  // While dragging, the order lives here and is saved once on drop: saving
  // every swap would let the storage listener reload an older order mid-drag.
  const [draft, setDraft] = useState<QueueItem[]>();
  const draftRef = useRef<QueueItem[]>(undefined);
  const listRef = useRef<HTMLUListElement>(null);
  const items = draft ?? saved;

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    setItems(next);
    // Moving the row in the DOM drops focus; put it back on its handle.
    requestAnimationFrame(() =>
      listRef.current
        ?.querySelector<HTMLElement>(`[data-handle="${queueKey(item!)}"]`)
        ?.focus(),
    );
  };

  if (!items.length) {
    return (
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
  }

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Далі</SidebarGroupLabel>
        <Button
          variant="ghost"
          size="sm"
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent h-7 text-xs"
          onClick={clear}
        >
          Очистити
        </Button>
      </div>
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
            onMove={(offset) => move(index, offset)}
            onDragEnd={() => {
              if (draftRef.current) setItems(draftRef.current);
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
