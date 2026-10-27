import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import MaterialSymbolsPlaylistAddCheckRounded from '~icons/material-symbols/playlist-add-check-rounded';
import MaterialSymbolsPlaylistAddRounded from '~icons/material-symbols/playlist-add-rounded';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  preferredSource,
  progressOf,
  providerOrder,
} from '../context/player-context';
import { getEpisodeTitle, revealRow } from '../sidebar/episode-list';
import {
  getEpisodeRanges,
  getTeamName,
  groupTeams,
  type MergedTeam,
  mergeTeams,
  type TeamEpisode,
  teamKey,
} from '../teams';
import { useActiveQueue } from './use-active-queue';
import { queueKey } from './use-queue';

interface Props {
  data: API.WatchData;
  slug: string;
  container: HTMLElement;
}

/** A team's logo, name and the episodes it has. */
const TeamSummary: FC<{ team: MergedTeam }> = ({ team }) => (
  <>
    <Avatar className="size-8 rounded-md">
      <AvatarImage src={team.logo} alt="" />
      <AvatarFallback>{getTeamName(team)[0]}</AvatarFallback>
    </Avatar>
    <div className="grid min-w-0 flex-1 text-left leading-tight">
      <span className="truncate font-medium">{getTeamName(team)}</span>
      <span className="text-muted-foreground truncate text-xs">
        {getEpisodeRanges(team.episodes.map(({ data }) => data))}
      </span>
    </div>
  </>
);

/**
 * Queues the page's anime's episodes without opening them, so whatever plays
 * keeps playing. They come from the team the player would pick, or any other
 * the user chooses, whichever provider has it.
 */
const QueueMenu: FC<Props> = ({ data, slug, container }) => {
  const { items, toggle, add } = useActiveQueue();
  const [open, setOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [chosen, setChosen] = useState<{ slug: string; key: string }>();
  const nextRowRef = useRef<HTMLDivElement>(null);

  // Picked on opening, by the settings and the tracker of that moment.
  const menu = useMemo(() => {
    if (!open) return undefined;
    const preferred = preferredSource(data, slug);
    const preferredKey = teamKey(preferred.provider, preferred.team);
    // The player's pick first, then the rest by name.
    const teams = mergeTeams(data, [
      preferred.provider,
      ...providerOrder(data),
    ]).toSorted(
      (a, b) =>
        Number(b.key === preferredKey) - Number(a.key === preferredKey) ||
        getTeamName(a).localeCompare(getTeamName(b)),
    );
    return { teams, groups: groupTeams(teams), watched: progressOf(slug) };
  }, [open, data, slug]);

  const team =
    menu &&
    (menu.teams.find(
      ({ key }) => chosen?.slug === slug && key === chosen.key,
    ) ??
      menu.teams[0]);

  // Opens on the episode after the user's progress, as does another team.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      if (nextRowRef.current) revealRow(nextRowRef.current, 'center');
    });
    return () => cancelAnimationFrame(frame);
  }, [open, team?.key]);

  const queued = new Set(items.map(queueKey));
  const queuedHere = items.some((item) => item.slug === slug);
  const itemOf = ({ provider, team, data }: TeamEpisode) => ({
    slug,
    episode: data.episode,
    provider,
    team,
  });
  const unwatched =
    team?.episodes.filter(
      (episode) =>
        episode.data.episode > menu!.watched &&
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
        {menu && team && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-foreground text-sm">
                До черги
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            {menu.teams.length > 1 ? (
              <DropdownMenuSub open={teamsOpen} onOpenChange={setTeamsOpen}>
                <DropdownMenuSubTrigger>
                  <TeamSummary team={team} />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent container={container} className="w-64">
                  <ScrollArea className="max-h-80" scrollFade>
                    <DropdownMenuRadioGroup
                      value={team.key}
                      onValueChange={(key: string) => {
                        setChosen({ slug, key });
                        setTeamsOpen(false);
                      }}
                    >
                      {menu.groups.map((group) => (
                        <DropdownMenuGroup key={group.type}>
                          <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                          {group.teams.map((option) => (
                            <DropdownMenuRadioItem
                              key={option.key}
                              value={option.key}
                            >
                              <TeamSummary team={option} />
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuGroup>
                      ))}
                    </DropdownMenuRadioGroup>
                  </ScrollArea>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                <TeamSummary team={team} />
              </div>
            )}
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
              {/* Re-measures when another team's list replaces this one. */}
              <ScrollAreaPrimitive.Content style={{ minWidth: 0 }}>
                {team.episodes.map((episode) => {
                  const { episode: number } = episode.data;
                  const title = getEpisodeTitle(episode.data);
                  return (
                    <DropdownMenuCheckboxItem
                      key={number}
                      ref={number === menu.watched + 1 ? nextRowRef : undefined}
                      checked={queued.has(queueKey(itemOf(episode)))}
                      onCheckedChange={() => toggle(itemOf(episode))}
                      className={cn(
                        number <= menu.watched && 'text-muted-foreground',
                      )}
                    >
                      <span className="text-muted-foreground w-[4ch] shrink-0 text-right text-xs tabular-nums">
                        {number}
                      </span>
                      <span className="truncate">
                        {title ?? `Епізод ${number}`}
                      </span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </ScrollAreaPrimitive.Content>
            </ScrollArea>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QueueMenu;
