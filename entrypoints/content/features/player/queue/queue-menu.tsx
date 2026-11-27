import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import MaterialSymbolsGroupOutlineRounded from '~icons/material-symbols/group-outline-rounded';
import MaterialSymbolsKeyboardArrowUpRounded from '~icons/material-symbols/keyboard-arrow-up-rounded';
import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';
import MaterialSymbolsPlaylistAddRounded from '~icons/material-symbols/playlist-add-rounded';
import MaterialSymbolsPlaylistPlayRounded from '~icons/material-symbols/playlist-play-rounded';
import MaterialSymbolsPlaylistRemoveRounded from '~icons/material-symbols/playlist-remove-rounded';
import MaterialSymbolsUndoRounded from '~icons/material-symbols/undo-rounded';

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
import { Kbd } from '@/components/ui/kbd';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { plural } from '@/utils/plural';

import { usePlayer } from '../context/player-context';
import { preferredTeam, progressOf, teamsOf } from '../context/sources';
import { isPlayerOpen, playQueue, showQueue } from '../player';
import { getEpisodeTitle, revealRow } from '../sidebar/episode-list';
import { getEpisodeRanges, groupTeams, type MergedTeam } from '../teams';
import { useActiveQueue } from './use-active-queue';
import { type QueueItem, queueKey, useQueue } from './use-queue';

const EPISODES = { one: 'епізод', few: 'епізоди', many: 'епізодів' };

const episodeCount = (count: number) => `${count} ${plural(count, EPISODES)}`;

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
      <AvatarFallback className="rounded-md">{team.title[0]}</AvatarFallback>
    </Avatar>
    <div className="grid min-w-0 flex-1 text-left leading-tight">
      <span className="truncate font-medium">{team.title}</span>
      <span className="text-muted-foreground truncate text-xs tabular-nums">
        {getEpisodeRanges(team.episodes)}
      </span>
    </div>
  </>
);

/** How many of the anime's episodes are queued, popping as it changes. */
const CountBadge: FC<{ count: number }> = ({ count }) => (
  // The anime page has no player around it to set this.
  <MotionConfig reducedMotion="user">
    <AnimatePresence initial={false}>
      {count > 0 && (
        <motion.span
          key="badge"
          aria-hidden
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0.3 }}
          className="bg-primary text-primary-foreground pointer-events-none absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center overflow-hidden rounded-full px-1 text-[10px] leading-none font-semibold tabular-nums"
        >
          <motion.span
            key={count}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  </MotionConfig>
);

/**
 * Queues the page's anime's episodes without opening them, so whatever plays
 * keeps playing. They come from the team the player would pick, or any other
 * the user chooses, whichever provider has it, and go among the anime's
 * queued ones in order. Shift picks every episode since the last one ticked.
 */
const QueueMenu: FC<Props> = ({ data, slug, container }) => {
  const queue = useActiveQueue();
  const { items } = queue;
  const [open, setOpen] = useState(false);
  // Counts openings. The menu keeps the last one's contents while it closes,
  // or its exit animation would play on an empty popup.
  const [opened, setOpened] = useState(0);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [chosen, setChosen] = useState<{ slug: string; key: string }>();
  // The episode ticked last, where a shift-click's range starts.
  const anchorRef = useRef<number>(undefined);
  const nextRowRef = useRef<HTMLDivElement>(null);
  // What "remove this anime" took off, offered back until the menu closes
  // or the queue is changed otherwise.
  const [undo, setUndo] = useState<{
    before: QueueItem[];
    removed: QueueItem[];
  }>();
  const [starting, setStarting] = useState<'loading' | 'failed' | 'dropped'>();
  const playerSlug = usePlayer((state) => state.slug);
  const playerEpisode = usePlayer((state) => state.currentEpisode?.episode);

  // Picked on opening, by the settings and the tracker of that moment.
  const menu = useMemo(() => {
    if (!opened) return undefined;
    const teams = teamsOf(data, usePlayer.getState().pinnedProvider);
    const preferredKey = preferredTeam(teams, slug).key;
    // The player's pick first, then the rest by name.
    teams.sort(
      (a, b) => Number(b.key === preferredKey) - Number(a.key === preferredKey),
    );
    return {
      teams,
      groups: groupTeams(teams),
      watched: progressOf(slug),
      playerOpen: isPlayerOpen(),
      // Touch has no shift to hint at.
      finePointer: matchMedia('(pointer: fine)').matches,
    };
  }, [opened, data, slug]);

  const team =
    menu &&
    (menu.teams.find(
      ({ key }) => chosen?.slug === slug && key === chosen.key,
    ) ??
      menu.teams[0]);

  // Opens on the episode after the user's progress, as does another team.
  useEffect(() => {
    if (!open) return;
    anchorRef.current = undefined;
    const frame = requestAnimationFrame(() => {
      if (nextRowRef.current) revealRow(nextRowRef.current, 'center');
    });
    return () => cancelAnimationFrame(frame);
  }, [open, team?.key]);

  // Where each episode is in the whole queue, counted from one.
  const positions = new Map(
    items.map((item, index) => [queueKey(item), index]),
  );
  const queuedHere = items.filter((item) => item.slug === slug);
  const itemOf = ({ provider, episode }: API.EpisodeData): QueueItem => ({
    slug,
    episode,
    provider,
    team: team!.key,
  });
  const isQueued = (episode: API.EpisodeData) =>
    positions.has(queueKey({ slug, episode: episode.episode }));
  // The playing episode can't be queued, as in the player's own list.
  const isPlaying = (episode: API.EpisodeData) =>
    !!menu?.playerOpen &&
    playerSlug === slug &&
    playerEpisode === episode.episode;
  const queueable = (episode: API.EpisodeData) =>
    !isQueued(episode) && !isPlaying(episode);
  const unwatched =
    team?.episodes.filter(
      (episode) => episode.episode > menu!.watched && queueable(episode),
    ) ?? [];
  // The list opens on the first episode after the user's progress, marked
  // when some are watched.
  const firstUnwatched = team?.episodes.find(
    ({ episode }) => episode > menu!.watched,
  );

  /** Ticks or unticks `episode`, with shift every episode since the last. */
  const tick = (episode: API.EpisodeData, checked: boolean, shift: boolean) => {
    const episodes = team!.episodes;
    const at = episodes.indexOf(episode);
    const from =
      shift && anchorRef.current !== undefined
        ? episodes.findIndex(({ episode }) => episode === anchorRef.current)
        : -1;
    anchorRef.current = episode.episode;
    setUndo(undefined);
    const range =
      from === -1
        ? [episode]
        : episodes.slice(Math.min(from, at), Math.max(from, at) + 1);

    if (checked) {
      queue.insert(range.filter(queueable).map(itemOf));
    } else {
      queue.remove(range.filter(isQueued).map(itemOf));
    }
  };

  // A room's queue plays only in the open player, which a room needs.
  const footerAction =
    items.length > 0 && (!!menu?.playerOpen || !queue.shared);
  const shiftHint = !!menu?.finePointer && (team?.episodes.length ?? 0) > 1;

  const startQueue = async () => {
    setStarting('loading');
    // The player shows why an episode was dropped once it opens.
    if (await playQueue()) setOpen(false);
    // Unavailable episodes were dropped on the way; none was left.
    else setStarting(useQueue.getState().items.length ? 'failed' : 'dropped');
  };

  const label = queuedHere.length
    ? `Черга: ${episodeCount(queuedHere.length)} цього аніме`
    : 'Додати до черги';

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Reset on opening, not closing, so nothing changes mid-animation.
        if (!next) return;
        setOpened((count) => count + 1);
        setUndo(undefined);
        setStarting(undefined);
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="md"
            className="relative w-8 px-0"
            aria-label={label}
            title={label}
          />
        }
      >
        <MaterialSymbolsKeyboardArrowUpRounded className="text-muted-foreground size-5 transition-transform duration-200 group-aria-expanded/button:rotate-180" />
        <CountBadge count={queuedHere.length} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        container={container}
        align="end"
        collisionPadding={8}
        className="w-80 max-w-[calc(100vw-1rem)] p-0"
      >
        {menu && team && (
          <>
            <div className="p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-foreground flex items-center gap-1.5 text-sm">
                  {queue.shared && (
                    <MaterialSymbolsGroupOutlineRounded className="text-muted-foreground size-4" />
                  )}
                  <span className="flex-1 truncate">
                    {queue.shared ? 'До спільної черги' : 'Додати до черги'}
                  </span>
                  {items.length > 0 && (
                    <span className="text-muted-foreground text-xs font-normal tabular-nums">
                      У черзі {items.length}
                    </span>
                  )}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              {menu.teams.length > 1 ? (
                <DropdownMenuSub open={teamsOpen} onOpenChange={setTeamsOpen}>
                  <DropdownMenuSubTrigger
                    aria-label={`Команда: ${team.title}. Змінити`}
                  >
                    <TeamSummary team={team} />
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    container={container}
                    className="w-64"
                  >
                    <ScrollArea
                      className="max-h-80 *:data-[slot=scroll-area-viewport]:overscroll-contain"
                      scrollFade
                    >
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
              {/* Both stay open, so the episodes below show the change, and
                  stay put, so a second click can't land on the other. */}
              {(unwatched.length > 0 || queuedHere.length > 0 || undo) && (
                <DropdownMenuItem
                  closeOnClick={false}
                  disabled={!unwatched.length}
                  onClick={() => {
                    queue.insert(unwatched.map(itemOf));
                    anchorRef.current = undefined;
                    setUndo(undefined);
                  }}
                >
                  <MaterialSymbolsPlaylistAddRounded />
                  {!unwatched.length
                    ? menu.watched > 0
                      ? 'Непереглянуті вже в черзі'
                      : 'Усе вже в черзі'
                    : menu.watched > 0
                      ? 'Усі непереглянуті'
                      : unwatched.length < team.episodes.length
                        ? 'Решта епізодів'
                        : 'Усі епізоди'}
                  {unwatched.length > 0 && (
                    <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                      {unwatched.length}
                    </span>
                  )}
                </DropdownMenuItem>
              )}
              {queuedHere.length > 0 ? (
                <DropdownMenuItem
                  closeOnClick={false}
                  onClick={() => {
                    setUndo({ before: items, removed: queuedHere });
                    queue.remove(queuedHere);
                    anchorRef.current = undefined;
                  }}
                >
                  <MaterialSymbolsPlaylistRemoveRounded />
                  Прибрати це аніме з черги
                  <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                    {queuedHere.length}
                  </span>
                </DropdownMenuItem>
              ) : (
                undo && (
                  <DropdownMenuItem
                    closeOnClick={false}
                    onClick={() => {
                      queue.restore(undo.before, undo.removed);
                      setUndo(undefined);
                    }}
                  >
                    <MaterialSymbolsUndoRounded />
                    Повернути до черги
                    <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                      {undo.removed.length}
                    </span>
                  </DropdownMenuItem>
                )
              )}
            </div>
            <DropdownMenuSeparator className="mx-0 my-0" />
            <ScrollArea
              className="max-h-72 *:data-[slot=scroll-area-viewport]:overscroll-contain"
              scrollFade
            >
              {/* Re-measures when another team's list replaces this one. */}
              <ScrollAreaPrimitive.Content
                style={{ minWidth: 0 }}
                className="p-1"
              >
                {team.episodes.map((episode) => {
                  const { episode: number } = episode;
                  const title = getEpisodeTitle(episode);
                  const position = positions.get(
                    queueKey({ slug, episode: number }),
                  );
                  const watched = number <= menu.watched;
                  const playing = isPlaying(episode);
                  return (
                    <div key={`${number}:${episode.video_url}`}>
                      {episode === firstUnwatched && menu.watched > 0 && (
                        <div
                          aria-hidden
                          className="text-muted-foreground flex items-center gap-2 px-2 py-1 text-[11px] font-medium"
                        >
                          <span className="bg-border h-px flex-1" />
                          Ви зупинилися тут
                          <span className="bg-border h-px flex-1" />
                        </div>
                      )}
                      <DropdownMenuCheckboxItem
                        ref={
                          episode === firstUnwatched ? nextRowRef : undefined
                        }
                        checked={position !== undefined}
                        disabled={playing && position === undefined}
                        onCheckedChange={(checked, { event }) =>
                          tick(
                            episode,
                            checked,
                            (event as MouseEvent | KeyboardEvent).shiftKey,
                          )
                        }
                        aria-description={
                          [
                            playing && 'грає зараз',
                            watched && 'переглянуто',
                            position !== undefined &&
                              `${position + 1}-й у черзі`,
                          ]
                            .filter(Boolean)
                            .join(', ') || undefined
                        }
                        className={cn(
                          'data-checked:bg-primary/8 data-checked:focus:bg-accent gap-3',
                          // Current, not broken: it reads like the player's row.
                          playing && 'bg-accent/60 data-disabled:opacity-100',
                        )}
                      >
                        <span
                          className={cn(
                            'w-[3ch] shrink-0 text-right text-xs tabular-nums',
                            position === undefined
                              ? 'text-muted-foreground'
                              : 'text-primary font-medium',
                          )}
                        >
                          {number}
                        </span>
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate',
                            watched &&
                              position === undefined &&
                              'text-muted-foreground',
                          )}
                        >
                          {title ?? `Епізод ${number}`}
                        </span>
                        {playing && (
                          <span
                            aria-hidden
                            className="text-primary shrink-0 text-[11px] font-medium"
                          >
                            Зараз
                          </span>
                        )}
                        {position !== undefined && (
                          <span
                            aria-hidden
                            title={`${position + 1}-й у черзі`}
                            className="text-muted-foreground shrink-0 text-[11px] tabular-nums"
                          >
                            #{position + 1}
                          </span>
                        )}
                      </DropdownMenuCheckboxItem>
                    </div>
                  );
                })}
              </ScrollAreaPrimitive.Content>
            </ScrollArea>
            {(footerAction || shiftHint) && (
              <>
                <DropdownMenuSeparator className="mx-0 my-0" />
                <div className="flex items-center gap-2 p-1">
                  {footerAction &&
                    (menu.playerOpen ? (
                      <DropdownMenuItem className="flex-1" onClick={showQueue}>
                        <MaterialSymbolsPlaylistPlayRounded />
                        Показати чергу
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        className="flex-1"
                        closeOnClick={false}
                        disabled={starting === 'loading'}
                        aria-busy={starting === 'loading' || undefined}
                        onClick={() => void startQueue()}
                      >
                        {starting === 'loading' ? (
                          <Spinner />
                        ) : (
                          <MaterialSymbolsPlayArrowRounded />
                        )}
                        Грати чергу
                      </DropdownMenuItem>
                    ))}
                  {shiftHint && (
                    <span className="text-muted-foreground ml-auto flex shrink-0 items-center gap-1 px-2 py-1.5 text-xs">
                      <Kbd>Shift</Kbd>
                      кілька одразу
                    </span>
                  )}
                </div>
              </>
            )}
            {/* Outside the footer, which goes once the queue empties. */}
            <p
              role="status"
              className="text-destructive px-3 pb-2 text-xs empty:hidden"
            >
              {starting === 'failed' &&
                'Не вдалося запустити чергу. Спробуйте ще раз.'}
              {starting === 'dropped' &&
                'Жоден епізод з черги більше не доступний, тож її очищено.'}
            </p>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QueueMenu;
