import { ChevronsUpDown } from 'lucide-react';
import { motion } from 'motion/react';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ProviderTeamIFrame } from '@/utils/provider_classes';
import MaterialSymbolsStarRateOutlineRounded from '~icons/material-symbols/star-rate-outline-rounded';
import MaterialSymbolsStarRounded from '~icons/material-symbols/star-rounded';
import { usePlayer } from '../context/player-context';

interface Props {
  toggleWatchedState: (state: boolean) => void;
}

const getEpisodeRanges = (episodes: { episode: number }[]) => {
  if (!episodes.length) return '';

  const episodeNumbers = [...new Set(episodes.map((e) => e.episode))].sort(
    (a, b) => a - b,
  );

  const ranges = [];
  let start = episodeNumbers[0];
  let end = episodeNumbers[0];

  for (let i = 1; i < episodeNumbers.length; i++) {
    if (episodeNumbers[i] === end + 1) {
      end = episodeNumbers[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = episodeNumbers[i];
      end = episodeNumbers[i];
    }
  }

  ranges.push(start === end ? `${start}` : `${start}-${end}`);

  return ranges.join(', ');
};

const TeamSelect: FC<Props> = ({ toggleWatchedState }) => {
  const {
    container,
    provider,
    team,
    setTeam,
    favoriteTeam,
    setFavoriteTeam,
    removeFavoriteTeam,
    episodeData,
  } = usePlayer();
  const { data } = useWatchData();

  const { open: openSidebar } = useSidebar();

  const orderedTeams = useMemo<API.TeamData[]>(() => {
    if (!data || !provider) return [];
    if (!(data[provider] instanceof ProviderTeamIFrame)) return [];

    const teams = (data[provider] as ProviderTeamIFrame).getTeams();
    return teams.slice().sort((a: API.TeamData, b: API.TeamData) => {
      if (a.title === favoriteTeam?.team) return -1;
      if (b.title === favoriteTeam?.team) return 1;
      return 0;
    });
  }, [data, provider, favoriteTeam]);

  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClick = (event: PointerEvent) => {
      if (
        open &&
        contentRef.current &&
        triggerRef.current &&
        !event.composedPath().includes(contentRef.current) &&
        !event.composedPath().includes(triggerRef.current)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open]);

  if (!data || !provider || !team) return;

  const handleSelectTeam = (value: API.TeamData) => {
    setTeam(value);
    toggleWatchedState(false);
  };

  const handleFavorite = (
    e: React.MouseEvent<HTMLButtonElement>,
    team: API.TeamData,
  ) => {
    e.stopPropagation();

    if (
      favoriteTeam?.provider === provider &&
      favoriteTeam?.team === team.title
    ) {
      removeFavoriteTeam();
      return;
    }

    setFavoriteTeam(team.title);
  };

  return (
    data[provider] instanceof ProviderTeamIFrame && (
      <SidebarMenuItem>
        <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={team.title}
                // tooltipContainer={container}
                ref={triggerRef}
              />
            }
          >
            <Avatar className="size-8 rounded-md">
              <AvatarImage src={team.logo} />
              <AvatarFallback>{team.title[0]}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{team.title}</span>
              <span className="truncate text-xs">
                {episodeData && getEpisodeRanges(episodeData)}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align={openSidebar ? 'end' : 'start'}
            side={openSidebar ? 'bottom' : 'left'}
            sideOffset={openSidebar ? 4 : 12}
            container={container}
            ref={contentRef}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Команди
              </DropdownMenuLabel>
              {orderedTeams.map((team) => (
                <motion.div
                  key={team.title}
                  layoutId={team.title}
                  layout
                  transition={{
                    type: 'spring',
                    stiffness: 600,
                    damping: 40,
                  }}
                >
                  <DropdownMenuItem
                    onClick={() => handleSelectTeam(team)}
                    className="group/item p-0 font-normal"
                  >
                    <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-md">
                        <AvatarImage src={team.logo} alt={team.title} />
                        <AvatarFallback>{team.title[0]}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {team.title}
                        </span>
                        <span className="truncate text-xs">
                          {getEpisodeRanges(
                            (data[provider] as ProviderTeamIFrame).teams[
                              team.title
                            ].episodes,
                          )}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className={cn(
                          'group',
                          !(
                            favoriteTeam?.provider === provider &&
                            favoriteTeam?.team === team.title
                          ) && 'hidden group-hover/item:inline-flex',
                        )}
                        onClick={(e) => handleFavorite(e, team)}
                      >
                        <div className="relative">
                          <div
                            className={cn(
                              'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out will-change-[transform,opacity,filter]',
                              favoriteTeam?.provider === provider &&
                                favoriteTeam?.team === team.title
                                ? 'scale-100 opacity-100 blur-0'
                                : 'scale-[0.25] opacity-0 blur-xs',
                            )}
                          >
                            <MaterialSymbolsStarRounded className="size-5! text-yellow-400 transition-transform duration-300 group-hover:scale-125" />
                          </div>
                          <div
                            className={cn(
                              'opacity transition-[transform,filter] duration-300 ease-in-out will-change-[transform,opacity,filter]',
                              favoriteTeam?.provider === provider &&
                                favoriteTeam?.team === team.title
                                ? 'scale-[0.25] opacity-0 blur-xs'
                                : 'scale-100 opacity-100 blur-0',
                            )}
                          >
                            <MaterialSymbolsStarRateOutlineRounded className="size-5! text-muted-foreground transition-transform duration-300 group-hover:scale-125 group-hover:text-foreground" />
                          </div>
                        </div>
                      </Button>
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  );
};

export default TeamSelect;
