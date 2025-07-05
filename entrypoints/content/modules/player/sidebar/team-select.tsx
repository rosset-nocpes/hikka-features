import { ChevronsUpDown } from 'lucide-react';
import { FC } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { getWatched, usePlayerContext } from '../context/player-context';

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
  const playerContext = usePlayerContext();
  const { data } = useWatchData();

  const { open } = useSidebar();

  const handleSelectTeam = (value: string) => {
    const newEpisodeData = data![playerContext.state.provider][value];

    const newEpisode =
      data![playerContext.state.provider][value].find(
        (episode: API.EpisodeData) => episode.episode === getWatched() + 1,
      ) || data![playerContext.state.provider][value][0];

    playerContext.setState((prev) => ({
      ...prev,
      team: value,
      episodeData: newEpisodeData,
      currentEpisode: newEpisode,
    }));
    toggleWatchedState(false);
  };

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            tooltip={STUDIO_CORRECTED_NAMES[playerContext.state.team]}
            tooltipContainer={playerContext.state.container}
          >
            <Avatar className="size-8 rounded-md">
              <AvatarImage
                src={
                  STUDIO_LOGOS[
                    STUDIO_CORRECTED_NAMES[playerContext.state.team]
                      ? STUDIO_CORRECTED_NAMES[playerContext.state.team]
                          .replaceAll(' ', '')
                          .toLowerCase()
                      : playerContext.state.team
                          .replaceAll(' ', '')
                          .toLowerCase()
                  ]
                }
              />
              <AvatarFallback>{playerContext.state.team[0]}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {playerContext.state.team}
              </span>
              <span className="truncate text-xs">
                {getEpisodeRanges(playerContext.state.episodeData)}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align={open ? 'end' : 'start'}
          side={open ? 'bottom' : 'left'}
          sideOffset={open ? 4 : 12}
          container={playerContext.state.container}
        >
          <DropdownMenuLabel className="text-muted-foreground text-xs">
            Команди
          </DropdownMenuLabel>
          {Object.keys(data![playerContext.state.provider]).map((team) => (
            <DropdownMenuItem
              key={team}
              onClick={() => handleSelectTeam(team)}
              className="p-0 font-normal"
            >
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-md">
                  <AvatarImage
                    src={
                      STUDIO_LOGOS[
                        STUDIO_CORRECTED_NAMES[team]
                          ? STUDIO_CORRECTED_NAMES[team]
                              .replaceAll(' ', '')
                              .toLowerCase()
                          : team.replaceAll(' ', '').toLowerCase()
                      ]
                    }
                    alt={team}
                  />
                  <AvatarFallback>{team[0]}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{team}</span>
                  <span className="truncate text-xs">
                    {getEpisodeRanges(
                      data![playerContext.state.provider][team],
                    )}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export default TeamSelect;
