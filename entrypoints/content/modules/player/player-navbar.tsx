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
import { usePlayerContext } from './context/player-context';
import player from './player';

interface Props {
  container: HTMLElement;
  ctx: ContentScriptContext;
  data: any;
  showControls: boolean;
}

const PlayerNavbar: FC<Props> = ({ container, ctx, data, showControls }) => {
  const playerContext = usePlayerContext();
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
          onClick={() =>
            player(ctx, data!, playerContext.state.animeData)!.then((x) =>
              x!.remove(),
            )
          }
        >
          <MaterialSymbolsCloseRounded />
        </Button>
        <span className="flex h-8 cursor-default items-center rounded-md bg-sidebar px-2 font-medium font-unitysans">
          Епізод {playerContext.state.currentEpisode.episode}
        </span>
      </div>
      <div
        className={cn(
          'absolute top-2 right-2 z-20 duration-300',
          !showControls &&
            playerContext.state.sidebarMode === 'offcanvas' &&
            !open
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
              checked={playerContext.state.sidebarMode === 'offcanvas'}
              onCheckedChange={(value) =>
                playerContext.setState((prev) => ({
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

export default PlayerNavbar;
