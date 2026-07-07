import { type FC } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/utils/cn';

import EpisodeList from './episode-list';
import ProviderSelect from './provider-select';
import TeamSelect from './team-select';

interface Props {
  toggleWatchedState: (state: boolean) => void;
  className?: string;
}

const PlayerSidebar: FC<Props> = ({ toggleWatchedState, className }) => {
  return (
    <Sidebar
      variant="floating"
      side="right"
      blur
      className={cn('pointer-events-auto flex overflow-hidden', className)}
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
      <SidebarContent>
        <ScrollArea className="h-full" scrollFade>
          <EpisodeList toggleWatchedState={toggleWatchedState} />
        </ScrollArea>
      </SidebarContent>
      {/* <SidebarFooter>
        <WatchTogetherButton />
      </SidebarFooter> */}
    </Sidebar>
  );
};

export default PlayerSidebar;
