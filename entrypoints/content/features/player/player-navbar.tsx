import { type FC, type PointerEvent as ReactPointerEvent, useRef } from 'react';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsDragIndicator from '~icons/material-symbols/drag-indicator';
import MaterialSymbolsOpenInFullRounded from '~icons/material-symbols/open-in-full-rounded';
import MaterialSymbolsViewListRounded from '~icons/material-symbols/view-list-rounded';

import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useHikkaContent } from '@/hooks/use-hikka';

import { usePlayer } from './context/player-context';
import PlayerMobilePanel from './mobile/player-mobile-panel';
import { useStackedLayout } from './mobile/use-stacked-layout';
import { closePlayer } from './player';
import WatchTogether from './player-overlay/buttons/watch-together';

// The toolbar's glass.
const GLASS = 'player-glass border';
// A ghost button's dark hover would leave the glass half transparent; the
// full fill is the glass, lit.
const GLASS_BUTTON = `${GLASS} dark:hover:bg-muted`;

interface Props {
  /** In mini mode the episode chip doubles as the drag handle. */
  onDragStart: (event: ReactPointerEvent<HTMLElement>) => void;
}

const PlayerNavbar: FC<Props> = ({ onDragStart }) => {
  const {
    container,
    slug,
    currentEpisode,
    miniPlayer,
    videoPiPActive,
    toggleMiniPlayer,
  } = usePlayer();
  const page = usePageStore();
  // Once the queue moves on to another anime, the chip names it.
  const otherAnime =
    !!slug && (page.contentType !== 'anime' || page.slug !== slug);
  const { data: anime } = useHikkaContent('anime', otherAnime ? slug : null);
  const animeTitle = otherAnime ? hikkaTitle(anime) : undefined;
  const { uiShown } = useIFramePlayer();
  const { open } = useSidebar();
  const actionsRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const stacked = useStackedLayout();

  const isCompactMode = miniPlayer || videoPiPActive;
  // Phones on their side or in fullscreen have no room for the panel.
  const panelInDrawer = isMobile && !stacked && !isCompactMode;

  return (
    <>
      <div
        className={cn(
          'absolute top-2 left-2 z-20 flex gap-2 transition-opacity duration-300',
          uiShown ? 'opacity-100' : 'opacity-0',
        )}
      >
        {!isCompactMode && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={GLASS_BUTTON}
            aria-label="Закрити програвач"
            onClick={closePlayer}
          >
            <MaterialSymbolsCloseRounded />
          </Button>
        )}
        {/* The panel under the video already names the episode. */}
        <span
          className={cn(
            GLASS,
            'flex h-8 items-center rounded-md px-2 font-medium',
            stacked && 'hidden',
            isCompactMode
              ? 'cursor-grab touch-none gap-0.5 pl-1 active:cursor-grabbing'
              : 'cursor-default',
          )}
          onPointerDown={isCompactMode ? onDragStart : undefined}
        >
          {isCompactMode && (
            <MaterialSymbolsDragIndicator className="text-muted-foreground size-5 shrink-0" />
          )}
          {animeTitle && !isCompactMode && (
            <span className="max-w-[min(40vw,20rem)] truncate">
              {animeTitle}
              <span className="text-muted-foreground px-1.5">·</span>
            </span>
          )}
          <span className="shrink-0">Епізод {currentEpisode?.episode}</span>
        </span>
      </div>
      <div
        ref={actionsRef}
        className={cn(
          'absolute z-20 flex gap-2 transition-[top,right,opacity] duration-300 motion-reduce:transition-opacity',
          // Clears the open floating sidebar, which phones don't have.
          open ? 'top-2 right-2 md:top-4 md:right-4' : 'top-2 right-2',
          !uiShown && (open ? 'max-md:opacity-0' : 'opacity-0'),
        )}
      >
        {isCompactMode ? (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              className={GLASS_BUTTON}
              aria-label="Вийти з мінірежиму"
              onClick={toggleMiniPlayer}
            >
              <MaterialSymbolsOpenInFullRounded />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={GLASS_BUTTON}
              aria-label="Закрити програвач"
              onClick={closePlayer}
            >
              <MaterialSymbolsCloseRounded />
            </Button>
          </>
        ) : (
          <>
            {/* Phones have no room for it in the toolbar row. */}
            <WatchTogether
              anchor={actionsRef}
              side="bottom"
              compact
              className={cn(GLASS_BUTTON, 'md:hidden')}
            />
            {panelInDrawer && (
              <Drawer swipeDirection="right">
                <DrawerTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={GLASS_BUTTON}
                      aria-label="Епізоди та джерело"
                    />
                  }
                >
                  <MaterialSymbolsViewListRounded />
                </DrawerTrigger>
                <DrawerContent container={container}>
                  <PlayerMobilePanel className="pt-[max(1rem,env(safe-area-inset-top))]" />
                </DrawerContent>
              </Drawer>
            )}
            <SidebarTrigger
              variant="ghost"
              size="icon-sm"
              className={cn(
                'hidden duration-300 md:inline-flex',
                !open && GLASS_BUTTON,
              )}
            />
          </>
        )}
      </div>
    </>
  );
};

export default PlayerNavbar;
