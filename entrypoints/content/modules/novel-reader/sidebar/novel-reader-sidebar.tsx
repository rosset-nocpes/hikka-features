import type { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/utils/cn';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import { useNovelReader } from '../context/novel-reader-context';
import novel_reader from '../novel-reader';
import ChapterList from './chapter-list';
import SortOptions from './sort-options';

const NovelReaderSidebar: FC = () => {
  const { open } = useSidebar();

  const { sidebarMode } = useNovelReader();

  return (
    <Sidebar
      collapsible={sidebarMode}
      side="right"
      className="flex overflow-hidden"
      // onMouseLeave={toggleSidebar}
    >
      <SidebarHeader>
        <div className="flex items-center justify-end">
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
              onClick={() => novel_reader().then((x) => x.remove())}
            >
              <MaterialSymbolsCloseRounded />
            </Button>
            <span className="cursor-default font-medium">Читалка</span>
            <Badge
              variant="outline"
              className="cursor-default bg-yellow-500 text-primary-foreground"
            >
              Beta
            </Badge>
          </div>
          <div className="h-8 w-8" />
        </div>
        <SortOptions />
      </SidebarHeader>
      <ChapterList />
      {/*<SidebarFooter>
        <ReaderSettings />
      </SidebarFooter>*/}
    </Sidebar>
  );
};

export default NovelReaderSidebar;
