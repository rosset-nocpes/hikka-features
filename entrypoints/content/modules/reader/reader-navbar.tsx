import { FC } from 'react';
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
  showControls?: boolean;
}

const ReaderNavbar: FC<Props> = ({ showControls = true }) => {
  const { open } = useSidebar();
  const { container, currentChapter, sidebarMode, setSidebarMode } =
    useReaderContext();

  return (
    <div className="hidden sm:flex">
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
          onClick={() => reader().then((x) => x.remove())}
        >
          <MaterialSymbolsCloseRounded />
        </Button>
        <span className="flex h-8 cursor-default items-center rounded-md bg-sidebar px-2 font-medium font-unitysans">
          {`Розділ ${currentChapter?.chapter}`}
          {currentChapter?.title ? `: ${currentChapter?.title}` : ''}
        </span>
      </div>
      <div
        className={cn(
          'absolute top-2 right-2 z-20 duration-300',
          !showControls && sidebarMode === 'offcanvas' && !open
            ? 'opacity-0'
            : 'opacity-100',
        )}
      >
        <ContextMenu modal={false}>
          <ContextMenuTrigger asChild>
            <SidebarTrigger
              variant="ghost"
              size="icon-sm"
              className="bg-sidebar"
            />
          </ContextMenuTrigger>
          <ContextMenuContent container={container}>
            <ContextMenuCheckboxItem
              checked={sidebarMode === 'offcanvas'}
              onCheckedChange={(value) =>
                setSidebarMode(value ? 'offcanvas' : 'icon')
              }
            >
              Компактний режим
            </ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  );
};

export default ReaderNavbar;
