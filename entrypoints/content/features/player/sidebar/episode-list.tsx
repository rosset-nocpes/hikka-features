import { Fragment, useEffect, useRef } from 'react';
import MaterialSymbolsPlaylistAddCheckRounded from '~icons/material-symbols/playlist-add-check-rounded';
import MaterialSymbolsPlaylistAddRounded from '~icons/material-symbols/playlist-add-rounded';

import MissingDivider, { countMissing } from '@/components/missing-divider';
import { Badge } from '@/components/ui/badge';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { progressOf, usePlayer } from '../context/player-context';
import { useActiveQueue } from '../queue/use-active-queue';
import { queueKey } from '../queue/use-queue';

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

const EpisodeList = () => {
  const { slug, provider, team, episodeData, currentEpisode, setEpisode } =
    usePlayer();
  const { items: queue, toggle: toggleQueued } = useActiveQueue();
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
  const queued = new Set(queue.map(queueKey));
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

          return (
            <Fragment key={ep.video_url}>
              {missing > 0 && (
                <SidebarMenuItem>
                  <MissingDivider count={missing} noun="episode" />
                </SidebarMenuItem>
              )}
              <SidebarMenuItem ref={isCurrent ? currentRowRef : null}>
                <SidebarMenuButton
                  className={cn(
                    dated && 'h-12',
                    ep.episode <= watched &&
                      !isCurrent &&
                      'text-muted-foreground',
                  )}
                  onClick={() => setEpisode(ep)}
                  isActive={isCurrent}
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
                </SidebarMenuButton>
                {slug && provider && (
                  <SidebarMenuAction
                    showOnHover={!isQueued}
                    aria-label={
                      isQueued ? 'Прибрати з черги' : 'Додати до черги'
                    }
                    title={isQueued ? 'Прибрати з черги' : 'Додати до черги'}
                    className={cn(
                      'peer-data-[size=default]/menu-button:top-1/2 peer-data-[size=default]/menu-button:-translate-y-1/2',
                      // Kept for its padding, so every row's badges line up.
                      isCurrent && !isQueued && 'invisible',
                    )}
                    onClick={() =>
                      toggleQueued({
                        slug,
                        episode: ep.episode,
                        provider,
                        team: team?.title ?? '',
                      })
                    }
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
