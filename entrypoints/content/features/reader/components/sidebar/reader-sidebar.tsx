import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import useReadData from '../../hooks/use-read-data';
import { useReader } from '../../hooks/use-reader';
import reader from '../../reader';
import { ReaderContentMode } from '../../reader.enums';
import ChapterList from './chapter-list';
import ReaderSettings from './settings/reader-settings';
import SortOptions from './sort-options';

const ReaderSidebar = () => {
  const { settings } = useReader();
  const { data } = useReadData();

  return (
    <Sidebar side="right" className="flex overflow-hidden">
      <SidebarHeader>
        <div className="flex items-center justify-end">
          <div className="flex min-w-8 flex-1 items-center gap-2 truncate">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => reader(settings.type).then((x) => x.remove())}
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
        {/* todo: add support for volumes */}
        {data?.displayMode === ReaderContentMode.Chapters && <SortOptions />}
      </SidebarHeader>
      <ChapterList
      // carouselApi={carouselApi}
      // scrollContainerRef={scrollContainerRef}
      />
      <SidebarFooter>
        <ReaderSettings />
      </SidebarFooter>
    </Sidebar>
  );
};

export default ReaderSidebar;
