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

  const handleSelectTeam = (value: string) => {
    setTeam(value);
    toggleWatchedState(false);
  };

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            tooltip={STUDIO_CORRECTED_NAMES[team]}
            tooltipContainer={container}
          >
            <Avatar className="size-8 rounded-md">
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
              />
              <AvatarFallback>{team[0]}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{team}</span>
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
          {Object.keys(data[provider]).map((team_name) => (
            <DropdownMenuItem
              key={team_name}
              onClick={() => handleSelectTeam(team_name)}
              className="p-0 font-normal"
            >
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-md">
                  <AvatarImage
                    src={
                      STUDIO_LOGOS[
                        STUDIO_CORRECTED_NAMES[team_name]
                          ? STUDIO_CORRECTED_NAMES[team_name]
                              .replaceAll(' ', '')
                              .toLowerCase()
                          : team_name.replaceAll(' ', '').toLowerCase()
                      ]
                    }
                    alt={team_name}
                  />
                  <AvatarFallback>{team_name[0]}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{team_name}</span>
                  <span className="truncate text-xs">
                    {getEpisodeRanges(data[provider][team_name])}
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
