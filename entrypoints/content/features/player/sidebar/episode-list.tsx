import { type FC, Fragment, useEffect, useRef } from 'react';
import MaterialSymbolsKeyboardDoubleArrowDownRounded from '~icons/material-symbols/keyboard-double-arrow-down-rounded';
import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';
import MaterialSymbolsPlaylistAddCheckRounded from '~icons/material-symbols/playlist-add-check-rounded';
import MaterialSymbolsPlaylistAddRounded from '~icons/material-symbols/playlist-add-rounded';
import MaterialSymbolsPlaylistRemoveRounded from '~icons/material-symbols/playlist-remove-rounded';
import MaterialSymbolsQueuePlayNextRounded from '~icons/material-symbols/queue-play-next-rounded';

import MissingDivider, { countMissing } from '@/components/missing-divider';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { progressOf, usePlayer } from '../context/player-context';
import { useActiveQueue } from '../queue/use-active-queue';
import { type QueueItem, queueKey } from '../queue/use-queue';

const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const episodeTypeBadges = {
  filler: { label: 'Філер', className: 'bg-warning/15 text-warning' },
  mixed: { label: 'Канон / філер', className: 'bg-warning/15 text-warning' },
  recap: { label: 'Рекап', className: 'bg-info/15 text-info' },
} as const;

/** Ukrainian only; the backend translates titles no catalogue has. */
export const getEpisodeTitle = (episode: API.EpisodeData) =>
  episode.title?.ua?.trim() || undefined;

const formatReleaseDate = (releasedAt?: number) =>
  releasedAt ? dateFormatter.format(new Date(releasedAt * 1000)) : undefined;

/** Scrolls the list itself, never the page, so the row is visible. */
export const revealRow = (row: HTMLElement, block: 'center' | 'nearest') => {
  const viewport = row.closest('[data-slot=scroll-area-viewport]');
  if (!viewport) return;

  const rowRect = row.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const top = rowRect.top - viewportRect.top;
  const bottom = rowRect.bottom - viewportRect.bottom;

  if (block === 'center') {
    viewport.scrollTop += top - (viewportRect.height - rowRect.height) / 2;
  } else if (top < 0) {
    viewport.scrollTop += top;
  } else if (bottom > 0) {
    viewport.scrollTop += bottom;
  }
};

/** The player's episode as the queue holds it, from the player's source. */
const queueItemOf = (episode: API.EpisodeData): QueueItem => {
  const { slug, provider, team } = usePlayer.getState();
  return {
    slug: slug!,
    episode: episode.episode,
    provider: provider!,
    team: team?.title ?? '',
  };
};

interface EpisodeMenuProps {
  /** The row's episode, then the later ones. */
  episodes: API.EpisodeData[];
  isCurrent: boolean;
  isQueued: boolean;
  queueable: boolean;
}

/**
 * A row's right click or long press menu: play it, queue it next or last,
 * or queue it with every episode after it.
 */
const EpisodeMenu: FC<EpisodeMenuProps> = ({
  episodes,
  isCurrent,
  isQueued,
  queueable,
}) => {
  const { slug, currentEpisode, setEpisode } = usePlayer();
  const queue = useActiveQueue();
  const [episode] = episodes;
  if (!episode) return null;

  const item = queueItemOf(episode);
  const queued = new Set(queue.items.map(queueKey));
  // Measured on opening only: lists run to a thousand episodes.
  const rest = queueable
    ? episodes
        .filter(
          (later) =>
            later.video_url !== currentEpisode?.video_url &&
            !queued.has(queueKey({ slug: slug!, episode: later.episode })),
        )
        .map(queueItemOf)
    : [];

  return (
    <>
      <DropdownMenuItem
        disabled={isCurrent}
        onClick={() => setEpisode(episode)}
      >
        <MaterialSymbolsPlayArrowRounded />
        Грати
      </DropdownMenuItem>
      {queueable && (
        <>
          <DropdownMenuSeparator />
          {!isCurrent && (
            <DropdownMenuItem onClick={() => queue.add([item], true)}>
              <MaterialSymbolsQueuePlayNextRounded />
              Грати наступним
            </DropdownMenuItem>
          )}
          {isQueued ? (
            <DropdownMenuItem onClick={() => queue.remove(item)}>
              <MaterialSymbolsPlaylistRemoveRounded />
              Прибрати з черги
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => queue.add([item])}>
              <MaterialSymbolsPlaylistAddRounded />
              Додати в кінець черги
            </DropdownMenuItem>
          )}
          {rest.length > 1 && (
            <DropdownMenuItem onClick={() => queue.add(rest)}>
              <MaterialSymbolsKeyboardDoubleArrowDownRounded />
              Додати звідси до кінця
              <span className="text-muted-foreground ml-auto pl-2 text-xs tabular-nums">
                {rest.length}
              </span>
            </DropdownMenuItem>
          )}
        </>
      )}
    </>
  );
};

const EpisodeList = () => {
  const { container, slug, provider, episodeData, currentEpisode, setEpisode } =
    usePlayer();
  const queue = useActiveQueue();
  const currentRowRef = useRef<HTMLLIElement>(null);
  const revealedRef = useRef(false);

  // Centre the current episode when the list first appears, then keep it in
  // view as playback moves on.
  useEffect(() => {
    if (!currentRowRef.current) return;
    revealRow(
      currentRowRef.current,
      revealedRef.current ? 'nearest' : 'center',
    );
    revealedRef.current = true;
  }, [currentEpisode?.video_url, episodeData]);

  if (!episodeData?.length) return null;

  const watched = progressOf(slug);
  const queued = new Set(queue.items.map(queueKey));
  // Decided per list so every row shares the same layout and height.
  const numbered = episodeData.some((episode) => getEpisodeTitle(episode));
  const numberWidth = `${String(Math.max(...episodeData.map((episode) => episode.episode))).length}ch`;
  const dated = episodeData.some((episode) => episode.releasedAt);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {episodeData.map((ep, index) => {
          const title = getEpisodeTitle(ep);
          const releaseDate = formatReleaseDate(ep.releasedAt);
          const previous = episodeData[index - 1]?.episode;
          const missing = countMissing(ep.episode, previous);
          const duplicate = previous === ep.episode;
          const typeBadge =
            ep.episode_type && ep.episode_type !== 'canon'
              ? episodeTypeBadges[ep.episode_type]
              : undefined;
          const isCurrent = ep.video_url === currentEpisode?.video_url;
          const isQueued =
            !!slug && queued.has(queueKey({ slug, episode: ep.episode }));
          // The playing episode can't be queued, only taken off the queue.
          const queueable = !!slug && !!provider && (!isCurrent || isQueued);

          return (
            <Fragment key={ep.video_url}>
              {missing > 0 && (
                <SidebarMenuItem>
                  <MissingDivider count={missing} noun="episode" />
                </SidebarMenuItem>
              )}
              <SidebarMenuItem ref={isCurrent ? currentRowRef : null}>
                <ContextMenu>
                  <ContextMenuTrigger
                    render={
                      <SidebarMenuButton
                        className={cn(
                          dated && 'h-12',
                          ep.episode <= watched &&
                            !isCurrent &&
                            'text-muted-foreground',
                          // The queue button takes room only while it shows: on
                          // hover or focus, and always when queued or on small
                          // screens, where it never hides. Hover needs `!`: the
                          // sidebar's `group-has` padding is as specific and later.
                          queueable &&
                            !isQueued &&
                            'md:group-focus-within/menu-item:pr-8! md:group-hover/menu-item:pr-8! md:group-has-data-[sidebar=menu-action]/menu-item:pr-2',
                        )}
                        onClick={() => setEpisode(ep)}
                        isActive={isCurrent}
                      />
                    }
                  >
                    {numbered && (
                      <span
                        className="text-muted-foreground shrink-0 text-right text-xs tabular-nums"
                        style={{ width: numberWidth }}
                      >
                        {ep.episode}
                      </span>
                    )}
                    <div className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate">
                        {title ?? `Епізод ${ep.episode}`}
                      </span>
                      {releaseDate && (
                        <span className="text-muted-foreground truncate text-xs font-normal">
                          {releaseDate}
                        </span>
                      )}
                    </div>
                    {duplicate && (
                      <Badge className="bg-muted text-muted-foreground h-4 rounded-sm px-1.5 text-[10px] font-semibold">
                        Дублікат
                      </Badge>
                    )}
                    {typeBadge && (
                      <Badge
                        className={cn(
                          'h-4 rounded-sm px-1.5 text-[10px] font-semibold',
                          typeBadge.className,
                        )}
                      >
                        {typeBadge.label}
                      </Badge>
                    )}
                  </ContextMenuTrigger>
                  <ContextMenuContent container={container}>
                    <EpisodeMenu
                      episodes={episodeData.slice(index)}
                      isCurrent={isCurrent}
                      isQueued={isQueued}
                      queueable={queueable}
                    />
                  </ContextMenuContent>
                </ContextMenu>
                {queueable && (
                  <SidebarMenuAction
                    showOnHover={!isQueued}
                    aria-label={
                      isQueued ? 'Прибрати з черги' : 'Додати до черги'
                    }
                    title={isQueued ? 'Прибрати з черги' : 'Додати до черги'}
                    className="transition-opacity peer-data-[size=default]/menu-button:top-1/2 peer-data-[size=default]/menu-button:-translate-y-1/2"
                    onClick={() => queue.toggle(queueItemOf(ep))}
                  >
                    {isQueued ? (
                      <MaterialSymbolsPlaylistAddCheckRounded />
                    ) : (
                      <MaterialSymbolsPlaylistAddRounded />
                    )}
                  </SidebarMenuAction>
                )}
              </SidebarMenuItem>
            </Fragment>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default EpisodeList;
