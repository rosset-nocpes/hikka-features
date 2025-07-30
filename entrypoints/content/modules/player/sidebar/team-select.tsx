import { ChevronsUpDown } from 'lucide-react';
import type { FC } from 'react';
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
import { ProviderTeamIFrame } from '@/utils/provider_classes';
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
  const { container, provider, team, setTeam, episodeData } = usePlayer();
  const { data } = useWatchData();

  const { open } = useSidebar();

  if (!data || !provider || !team) return;

  const handleSelectTeam = (value: API.TeamData) => {
    setTeam(value);
    toggleWatchedState(false);
  };

  return (
    data[provider] instanceof ProviderTeamIFrame && (
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
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
                <span className="truncate text-xs">
                  {episodeData && getEpisodeRanges(episodeData)}
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
            container={container}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Команди
            </DropdownMenuLabel>
            {data[provider].getTeams().map((team) => (
              <DropdownMenuItem
                key={team.title}
                onClick={() => handleSelectTeam(team)}
                className="p-0 font-normal"
              >
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-md">
                    <AvatarImage src={team.logo} alt={team.title} />
                    <AvatarFallback>{team.title[0]}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{team.title}</span>
                    <span className="truncate text-xs">
                      {getEpisodeRanges(
                        (data[provider] as ProviderTeamIFrame).teams[team.title]
                          .episodes,
                      )}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  );
};

export default TeamSelect;
