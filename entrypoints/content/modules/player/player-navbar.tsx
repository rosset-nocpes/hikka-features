import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import { usePlayer } from './context/player-context';
import player from './player';

interface Props {
  showControls: boolean;
}

const PlayerNavbar: FC<Props> = ({ showControls }) => {
  const { container, sidebarMode, setSidebarMode, currentEpisode } =
    usePlayer();
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
          onClick={() => player().then((x) => x.remove())}
        >
          <MaterialSymbolsCloseRounded />
        </Button>
        <span className="flex h-8 cursor-default items-center rounded-md bg-sidebar px-2 font-medium">
          Епізод {currentEpisode?.episode}
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
        <ContextMenu>
          <ContextMenuTrigger
            render={
              <SidebarTrigger
                variant="ghost"
                size="icon-sm"
                className="hidden bg-sidebar md:inline-flex"
              />
            }
          />
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
    </>
  );
};

export default PlayerNavbar;
