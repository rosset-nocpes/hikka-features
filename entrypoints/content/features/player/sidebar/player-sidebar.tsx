import { type FC, useEffect, useRef, useState } from 'react';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';

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

import player from '../player';
import EpisodeList from './episode-list';
import ProviderSelect from './provider-select';
import TeamSelect from './team-select';

interface Props {
  toggleWatchedState: (state: boolean) => void;
  className?: string;
}

const PlayerSidebar: FC<Props> = ({ toggleWatchedState, className }) => {
  const [isScrolled, setIsScrolled] = useState({ top: false, bottom: false });
  const scrollRef = useRef<HTMLDivElement>(null);

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
      variant="floating"
      side="right"
      blur
      className={cn('flex overflow-hidden', className)}
      // onMouseLeave={toggleSidebar}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between">
            <span className="ml-2 cursor-default font-medium">Програвач</span>
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
