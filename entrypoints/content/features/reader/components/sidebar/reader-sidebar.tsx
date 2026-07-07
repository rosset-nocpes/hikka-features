import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';

import reader from '../../reader';
import ChapterList from './chapter-list';
import ReaderSettings from './settings/reader-settings';
import SortOptions from './sort-options';

const ReaderSidebar = () => {
  return (
    <Sidebar side="right" className="flex overflow-hidden">
      <SidebarHeader>
        <div className="flex items-center justify-end">
          <div className="flex min-w-8 flex-1 items-center gap-2 truncate">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => reader().then((x) => x.remove())}
            >
              <MaterialSymbolsCloseRounded />
            </Button>
            <span className="cursor-default font-medium">Читалка</span>
            <Badge
              variant="outline"
              className="text-primary-foreground cursor-default bg-yellow-500"
            >
              Beta
            </Badge>
          </div>
          <div className="h-8 w-8" />
        </div>
        <SortOptions />
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full" scrollFade>
          <ChapterList />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <ReaderSettings />
      </SidebarFooter>
    </Sidebar>
  );
};

export default ReaderSidebar;
