import { ChevronsUpDown } from 'lucide-react';
import type { FC } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { getAvailablePlayers, usePlayer } from '../context/player-context';

interface Props {
  toggleWatchedState: (state: boolean) => void;
}

const ProviderSelect: FC<Props> = ({ toggleWatchedState }) => {
  const { open } = useSidebar();

  const { container, provider, setProvider } = usePlayer();
  const { data } = useWatchData();

  if (!data) return;

  const avaliable_players = getAvailablePlayers(data);

  const handleSelectPlayer = (value: PlayerSource) => {
    setProvider(value);
    toggleWatchedState(false);
  };

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            disabled={avaliable_players.length === 1}
          >
            <Avatar className="size-8 rounded-md text-black">
              <AvatarFallback className="bg-primary">
                {provider?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {provider?.toUpperCase()}
              </span>
            </div>
            {avaliable_players.length > 1 && (
              <ChevronsUpDown className="ml-auto" />
            )}
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align={open ? 'end' : 'start'}
          side={open ? 'bottom' : 'left'}
          sideOffset={open ? 4 : 12}
          container={container}
        >
          <div className="flex flex-col">
            {avaliable_players.filter((elem) =>
              UkrainianPlayerSource.includes(elem),
            ).length > 0 && (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Україномовні
                </DropdownMenuLabel>
                <div className="flex flex-wrap">
                  {avaliable_players
                    .filter((elem) => UkrainianPlayerSource.includes(elem))
                    .map((elem: PlayerSource) => (
                      <DropdownMenuItem
                        key={elem}
                        onClick={() => handleSelectPlayer(elem)}
                        className={cn(
                          'flex-[1_1_calc(33.33%)] items-center justify-center px-1 py-1.5 font-normal',
                          provider === elem &&
                            'bg-accent/60 text-accent-foreground',
                        )}
                      >
                        <span className="flex h-8 items-center justify-center truncate text-center font-semibold">
                          {elem.toUpperCase()}
                        </span>
                      </DropdownMenuItem>
                    ))}
                </div>
              </DropdownMenuGroup>
            )}
            {avaliable_players.filter((elem) => SubPlayerSource.includes(elem))
              .length > 0 && (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Оригінал/Саби
                </DropdownMenuLabel>
                <div className="flex flex-wrap">
                  {avaliable_players
                    .filter((elem) => SubPlayerSource.includes(elem))
                    .map((elem: PlayerSource) => (
                      <DropdownMenuItem
                        key={elem}
                        onClick={() => handleSelectPlayer(elem)}
                        className={cn(
                          'flex-[1_1_calc(33.33%)] items-center justify-center px-1 py-1.5 font-normal',
                          provider === elem &&
                            'bg-accent/60 text-accent-foreground',
                        )}
                      >
                        <span className="flex h-8 items-center justify-center truncate text-center font-semibold">
                          {elem.toUpperCase()}
                        </span>
                      </DropdownMenuItem>
                    ))}
                </div>
              </DropdownMenuGroup>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export default ProviderSelect;
