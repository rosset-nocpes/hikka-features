import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

import EpisodeList from './episode-list';
import ProviderSelect from './provider-select';
import TeamSelect from './team-select';

const PlayerSidebar = () => {
  return (
    <Sidebar
      variant="floating"
      side="right"
      blur
      className="pointer-events-auto flex overflow-hidden"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between">
            <span className="ml-2 cursor-default font-medium">Програвач</span>
            <div className="h-8 w-8" />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <ProviderSelect />
          <TeamSelect />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <SidebarContent>
        <ScrollArea className="h-full" scrollFade>
          <EpisodeList />
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
};

export default PlayerSidebar;
