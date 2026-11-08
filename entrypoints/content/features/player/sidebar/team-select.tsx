import { motion } from 'motion/react';
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

import { isFavoriteTeam, usePlayer } from '../context/player-context';
import { getEpisodeRanges, groupTeams, type MergedTeam } from '../teams';

const TeamSelect = () => {
  const { container, teams, team, setTeam, favoriteKey, toggleFavoriteTeam } =
    usePlayer();

  if (!teams || !team) return;

  const teamGroups = groupTeams(teams, favoriteKey);
  const rangesOf = (shown: MergedTeam) => getEpisodeRanges(shown.episodes);

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              size="lg"
              tooltip={team.title}
              tooltipContainer={container}
            >
              <Avatar className="size-8 rounded-md">
                <AvatarImage src={team.logo} />
                <AvatarFallback>{team.title[0]}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{team.title}</span>
                <span className="truncate text-xs">{rangesOf(team)}</span>
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
                {group.teams.map((team) => {
                  const favorite = isFavoriteTeam({ favoriteKey }, team);
                  return (
                    <motion.div
                      key={team.key}
                      layoutId={team.key}
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
                            <AvatarImage src={team.logo} alt={team.title} />
                            <AvatarFallback>{team.title[0]}</AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                              {team.title}
                            </span>
                            <span className="truncate text-xs">
                              {rangesOf(team)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className={cn(
                              'group',
                              !favorite &&
                                'hidden group-hover/item:inline-flex',
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteTeam(team);
                            }}
                          >
                            <SwapIcon
                              active={favorite}
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
                  );
                })}
              </DropdownMenuGroup>
            ))}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export default TeamSelect;
