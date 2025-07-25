import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { CarouselApi } from '@/components/ui/carousel';
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/utils/cn';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import { useReaderContext } from '../context/reader-context';
import reader from '../reader';
import ChapterList from './chapter-list';
import ReaderSettings from './reader-settings';

interface Props {
  carouselApi: CarouselApi;
}

const ReaderSidebar: FC<Props> = ({ carouselApi }) => {
  const { open } = useSidebar();

  const { sidebarMode } = useReaderContext();

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
                onClick={() => reader()!.then((x) => x!.remove())}
              >
                <MaterialSymbolsCloseRounded />
              </Button>
              <span className="cursor-default font-medium font-unitysans">
                Читалка
              </span>
            </div>
            <div className="h-8 w-8" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <ChapterList carouselApi={carouselApi} />
      <SidebarFooter>
        <ReaderSettings />
      </SidebarFooter>
    </Sidebar>
  );
};

export default ReaderSidebar;
