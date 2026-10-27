import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import MaterialSymbolsPlaylistAddCheckRounded from '~icons/material-symbols/playlist-add-check-rounded';
import MaterialSymbolsPlaylistAddRounded from '~icons/material-symbols/playlist-add-rounded';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  episodesOf,
  preferredSource,
  progressOf,
} from '../context/player-context';
import { getEpisodeTitle, revealRow } from '../sidebar/episode-list';
import { getTeamName } from '../teams';
import { queueKey, useQueue } from './use-queue';

interface Props {
  data: API.WatchData;
  slug: string;
  container: HTMLElement;
}

/**
 * Queues the page's anime's episodes without opening them, from the source
 * the player would pick, so whatever plays keeps playing.
 */
const QueueMenu: FC<Props> = ({ data, slug, container }) => {
  const { items, toggle, add } = useQueue();
  const [open, setOpen] = useState(false);
  const nextRowRef = useRef<HTMLDivElement>(null);

  // Picked on opening, by the settings and the tracker of that moment.
  const menu = useMemo(() => {
    if (!open) return undefined;
    const { provider, team } = preferredSource(data, slug);
    const episodes = episodesOf(data, provider, team.title) ?? [];
    return {
      provider,
      team,
      // One row per episode, though a source may list one twice.
      episodes: [
        ...new Map(episodes.map((episode) => [episode.episode, episode])),
      ].map(([, episode]) => episode),
      watched: progressOf(slug),
    };
  }, [open, data, slug]);

  // Opens on the episode after the user's progress.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      if (nextRowRef.current) revealRow(nextRowRef.current, 'center');
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const queued = new Set(items.map(queueKey));
  const queuedHere = items.some((item) => item.slug === slug);
  const itemOf = (episode: API.EpisodeData) => ({
    slug,
    episode: episode.episode,
    provider: menu!.provider,
    team: menu!.team.title,
  });
  const unwatched =
    menu?.episodes.filter(
      (episode) =>
        episode.episode > menu.watched &&
        !queued.has(queueKey(itemOf(episode))),
    ) ?? [];

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-md"
            aria-label="Додати до черги"
            title="Додати до черги"
          />
        }
      >
        {queuedHere ? (
          <MaterialSymbolsPlaylistAddCheckRounded className="size-5" />
        ) : (
          <MaterialSymbolsPlaylistAddRounded className="size-5" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent container={container} align="end" className="w-72">
        {menu && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="grid leading-tight">
                <span className="text-foreground text-sm">До черги</span>
                <span className="truncate">
                  {menu.team.title ? getTeamName(menu.team) : menu.provider}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            {unwatched.length > 0 && (
              <DropdownMenuItem onClick={() => add(unwatched.map(itemOf))}>
                <MaterialSymbolsPlaylistAddRounded className="size-5" />
                Усі непереглянуті
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                  {unwatched.length}
                </span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <ScrollArea className="max-h-80" scrollFade>
              {menu.episodes.map((episode) => {
                const title = getEpisodeTitle(episode);
                return (
                  <DropdownMenuCheckboxItem
                    key={episode.episode}
                    ref={
                      episode.episode === menu.watched + 1
                        ? nextRowRef
                        : undefined
                    }
                    checked={queued.has(queueKey(itemOf(episode)))}
                    onCheckedChange={() => toggle(itemOf(episode))}
                    className={cn(
                      episode.episode <= menu.watched &&
                        'text-muted-foreground',
                    )}
                  >
                    <span className="text-muted-foreground w-[4ch] shrink-0 text-right text-xs tabular-nums">
                      {episode.episode}
                    </span>
                    <span className="truncate">
                      {title ?? `Епізод ${episode.episode}`}
                    </span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </ScrollArea>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QueueMenu;
