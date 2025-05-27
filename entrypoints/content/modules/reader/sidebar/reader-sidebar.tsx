import { FC } from 'react';
import { ContentScriptContext } from '#imports';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/utils/cn';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import { useReaderContext } from '../context/reader-context';
import reader from '../reader';
import ChapterList from './chapter-list';

interface Props {
  container: HTMLElement;
  ctx: ContentScriptContext;
  slug: string;
}

const ReaderSidebar: FC<Props> = ({ container, ctx, slug }) => {
  const { open } = useSidebar();

  const readerContext = useReaderContext();

  return (
    <Sidebar
      collapsible={readerContext.state.sidebarMode}
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
                onClick={() =>
                  reader(ctx, readerContext.state.mangaData, slug)!.then((x) =>
                    x!.remove(),
                  )
                }
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
        <SidebarMenu>
          {/* <ProviderSelect
            container={container}
            toggleWatchedState={toggleWatchedState}
          />
          <TeamSelect
            container={container}
            toggleWatchedState={toggleWatchedState}
          /> */}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <ChapterList container={container} />
      {/* <SidebarFooter>
        <WatchTogetherButton />
      </SidebarFooter> */}
    </Sidebar>
  );
};

export default ReaderSidebar;
