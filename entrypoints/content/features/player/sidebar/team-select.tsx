import { motion } from 'motion/react';
import { useMemo } from 'react';
import MaterialSymbolsStarRateOutlineRounded from '~icons/material-symbols/star-rate-outline-rounded';
import MaterialSymbolsStarRounded from '~icons/material-symbols/star-rounded';
import MaterialSymbolsUnfoldMoreRounded from '~icons/material-symbols/unfold-more-rounded';

import SwapIcon from '@/components/swap-icon';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { ProviderTeamIFrame } from '@/utils/provider_classes';

import {
  episodesOf,
  isFavoriteTeam,
  usePlayer,
} from '../context/player-context';
import { getEpisodeRanges, getTeamName, groupTeams } from '../teams';

const TeamSelect = () => {
  const {
    container,
    provider,
    team,
    setTeam,
    favoriteTeam,
    toggleFavoriteTeam,
    episodeData,
    watchData: data,
  } = usePlayer();

  const teamGroups = useMemo(() => {
    if (!data || !provider) return [];
    if (!(data[provider] instanceof ProviderTeamIFrame)) return [];

    return groupTeams(data[provider].getTeams(), favoriteTeam?.team);
  }, [data, provider, favoriteTeam]);

  if (!data || !provider || !team) return;

  return (
    data[provider] instanceof ProviderTeamIFrame && (
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={getTeamName(team)}
                tooltipContainer={container}
              >
                <Avatar className="size-8 rounded-md">
                  <AvatarImage src={team.logo} />
                  <AvatarFallback>{getTeamName(team)[0]}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {getTeamName(team)}
                  </span>
                  <span className="truncate text-xs">
                    {episodeData && getEpisodeRanges(episodeData)}
                  </span>
                </div>
                <MaterialSymbolsUnfoldMoreRounded className="ml-auto" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            align="end"
            side="bottom"
            sideOffset={4}
            container={container}
          >
            <ScrollArea
              className="max-h-96 *:data-[slot=scroll-area-viewport]:overscroll-contain"
              scrollFade
            >
              {teamGroups.map((group) => (
                <DropdownMenuGroup key={group.type}>
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    {group.label}
                  </DropdownMenuLabel>
                  {group.teams.map((team) => (
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
                        onClick={() => setTeam(team)}
                        className="group/item p-0 font-normal"
                      >
                        <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5 text-left text-sm">
                          <Avatar className="h-8 w-8 rounded-md">
                            <AvatarImage
                              src={team.logo}
                              alt={getTeamName(team)}
                            />
                            <AvatarFallback>
                              {getTeamName(team)[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                              {getTeamName(team)}
                            </span>
                            <span className="truncate text-xs">
                              {getEpisodeRanges(
                                episodesOf(data, provider, team.title) ?? [],
                              )}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className={cn(
                              'group',
                              !isFavoriteTeam(
                                { favoriteTeam, provider },
                                team,
                              ) && 'hidden group-hover/item:inline-flex',
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteTeam(team);
                            }}
                          >
                            <SwapIcon
                              active={isFavoriteTeam(
                                { favoriteTeam, provider },
                                team,
                              )}
                              on={
                                <MaterialSymbolsStarRounded className="size-5! text-yellow-400 transition-transform duration-150 ease-out motion-safe:group-hover:scale-125" />
                              }
                              off={
                                <MaterialSymbolsStarRateOutlineRounded className="text-muted-foreground group-hover:text-foreground size-5! transition-[color,scale] duration-150 ease-out motion-safe:group-hover:scale-125" />
                              }
                            />
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    </motion.div>
                  ))}
                </DropdownMenuGroup>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  );
};

export default TeamSelect;
