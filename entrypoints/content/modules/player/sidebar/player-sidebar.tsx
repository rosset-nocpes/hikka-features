import { type FC, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/utils/cn';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import { usePlayer } from '../context/player-context';
import player from '../player';
import EpisodeList from './episode-list';
import ProviderSelect from './provider-select';
import TeamSelect from './team-select';

interface Props {
  toggleWatchedState: (state: boolean) => void;
}

const PlayerSidebar: FC<Props> = ({ toggleWatchedState }) => {
  const [isScrolled, setIsScrolled] = useState({ top: false, bottom: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  const { sidebarMode } = usePlayer();
  const { open } = useSidebar();

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      setIsScrolled({
        top: element.scrollTop > 0,
        bottom: element.scrollTop + element.clientHeight < element.scrollHeight,
      });
    };

    element.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <Sidebar
      collapsible={sidebarMode}
      side="right"
      className="flex overflow-hidden"
      // onMouseLeave={toggleSidebar}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-end">
            <div
              className={cn(
                'flex min-w-8 flex-1 items-center gap-2 truncate duration-300',
                !open && 'text-transparent',
              )}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  'transition-[margin] duration-300',
                  !open && '-ml-2',
                )}
                onClick={() => player().then((x) => x.remove())}
              >
                <MaterialSymbolsCloseRounded />
              </Button>
              <span className="cursor-default font-medium font-unitysans">
                Програвач
              </span>
            </div>
            <div className="h-8 w-8" />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <ProviderSelect toggleWatchedState={toggleWatchedState} />
          <TeamSelect toggleWatchedState={toggleWatchedState} />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <SidebarContent
        ref={scrollRef}
        className={cn('group-data-[collapsible=icon]:overflow-auto', {
          'gradient-mask-t-90-d': isScrolled.top && isScrolled.bottom,
          'gradient-mask-t-90': isScrolled.top && !isScrolled.bottom,
          'gradient-mask-b-90': !isScrolled.top && isScrolled.bottom,
        })}
        style={{
          scrollbarWidth: 'none',
        }}
      >
        <EpisodeList toggleWatchedState={toggleWatchedState} />
      </SidebarContent>
      {/* <SidebarFooter>
        <WatchTogetherButton />
      </SidebarFooter> */}
    </Sidebar>
  );
};

export default PlayerSidebar;
