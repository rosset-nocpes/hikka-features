import MaterialSymbolsUnfoldMoreRounded from '~icons/material-symbols/unfold-more-rounded';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

import { usePlayer } from '../context/player-context';
import { groupProviders } from '../teams';

const ProviderSelect = () => {
  const { open } = useSidebar();
  const {
    container,
    provider,
    setProvider,
    favoriteTeam,
    watchData: data,
  } = usePlayer();

  if (!data) return;

  const groups = groupProviders(data);
  const single = groups.length === 1 && groups[0]!.titles.length === 1;
  const favoriteSource = favoriteTeam && data[favoriteTeam.provider];
  const favoriteLogo =
    favoriteSource instanceof ProviderTeamIFrame
      ? favoriteSource.getTeam(favoriteTeam!.team).logo
      : undefined;

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton size="lg" disabled={single}>
              <Avatar className="size-8 rounded-md text-black">
                <AvatarFallback className="bg-primary">
                  {provider?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-left text-sm leading-tight font-semibold">
                {provider?.toUpperCase()}
              </span>
              {!single && (
                <MaterialSymbolsUnfoldMoreRounded className="ml-auto" />
              )}
            </SidebarMenuButton>
          }
        />
        <DropdownMenuContent
          className="w-(--anchor-width) min-w-56 rounded-lg"
          align={open ? 'end' : 'start'}
          side={open ? 'bottom' : 'left'}
          sideOffset={open ? 4 : 12}
          container={container}
        >
          <div className="flex flex-col">
            {groups.map(({ lang, titles }) => (
              <DropdownMenuGroup key={lang}>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  {LANGUAGE_GROUP_NAMES[lang]}
                </DropdownMenuLabel>
                <div className="flex flex-wrap">
                  {titles.map((title) => (
                    <DropdownMenuItem
                      key={title}
                      onClick={() => setProvider(title)}
                      className={cn(
                        'flex-[1_0_50%] items-center justify-center overflow-hidden px-1 py-1.5 font-normal',
                        provider === title &&
                          'bg-accent/60 text-accent-foreground',
                      )}
                    >
                      {favoriteTeam?.provider === title && (
                        <Avatar className="size-5! rounded-sm">
                          <AvatarImage
                            src={favoriteLogo}
                            alt={favoriteTeam.team}
                          />
                          <AvatarFallback className="bg-muted-foreground/60">
                            {favoriteTeam.team[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="flex h-8 items-center justify-center truncate text-center font-semibold">
                        {title.toUpperCase()}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuGroup>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export default ProviderSelect;
