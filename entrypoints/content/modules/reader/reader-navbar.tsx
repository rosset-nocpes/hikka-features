import { MediaPlayerInstance } from '@vidstack/react';
import { FC } from 'react';
import { ContentScriptContext } from '#imports';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import { useReaderContext } from './context/reader-context';
import reader from './reader';

interface Props {
  container: HTMLElement;
  ctx: ContentScriptContext;
  data: any;
  slug: string;
  showControls?: boolean;
}

const ReaderNavbar: FC<Props> = ({
  container,
  ctx,
  data,
  slug,
  showControls = true,
}) => {
  const readerContext = useReaderContext();
  const { open } = useSidebar();

  return (
    <>
      <div
        className={cn(
          'absolute top-2 left-2 z-20 flex gap-2 duration-300',
          showControls && !open ? 'opacity-100' : 'opacity-0',
          open && '-top-8',
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="bg-sidebar"
          onClick={() => reader(ctx, data!, slug)!.then((x) => x!.remove())}
        >
          <MaterialSymbolsCloseRounded />
        </Button>
        <span className="flex h-8 cursor-default items-center rounded-md bg-sidebar px-2 font-medium font-unitysans">
          Розділ {readerContext.state.currentChapter.chapter}:{' '}
          {readerContext.state.currentChapter.title}
        </span>
      </div>
      <div
        className={cn(
          'absolute top-2 right-2 z-20 duration-300',
          !showControls &&
            readerContext.state.sidebarMode === 'offcanvas' &&
            !open
            ? 'opacity-0'
            : 'opacity-100',
        )}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <SidebarTrigger
              variant="ghost"
              size="icon-sm"
              className="bg-sidebar"
            />
          </ContextMenuTrigger>
          <ContextMenuContent container={container}>
            <ContextMenuCheckboxItem
              checked={readerContext.state.sidebarMode === 'offcanvas'}
              onCheckedChange={(value) =>
                readerContext.setState((prev) => ({
                  ...prev,
                  sidebarMode: value ? 'offcanvas' : 'icon',
                }))
              }
            >
              Компактний режим
            </ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </>
  );
};

export default ReaderNavbar;
