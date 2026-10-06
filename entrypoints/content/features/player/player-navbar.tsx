import type { FC, PointerEvent as ReactPointerEvent } from 'react';

import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsDragIndicator from '~icons/material-symbols/drag-indicator';
import MaterialSymbolsOpenInFullRounded from '~icons/material-symbols/open-in-full-rounded';

import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

import { usePlayer } from './context/player-context';
import { removePlayer } from './player';

const GLASS = 'bg-background/60 backdrop-blur-xl';

interface Props {
  /** In mini mode the episode chip doubles as the drag handle. */
  onDragStart: (event: ReactPointerEvent<HTMLElement>) => void;
}

const PlayerNavbar: FC<Props> = ({ onDragStart }) => {
  const { currentEpisode, miniPlayer, videoPiPActive, toggleMiniPlayer } =
    usePlayer();
  const { uiShown } = useIFramePlayer();
  const { open } = useSidebar();

  const isCompactMode = miniPlayer || videoPiPActive;

  return (
    <>
      <div
        className={cn(
          'absolute top-2 left-2 z-20 flex gap-2 duration-300',
          uiShown ? 'opacity-100' : 'opacity-0',
        )}
      >
        {!isCompactMode && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={GLASS}
            aria-label="Закрити програвач"
            onClick={removePlayer}
          >
            <MaterialSymbolsCloseRounded />
          </Button>
        )}
        <span
          className={cn(
            GLASS,
            'flex h-8 items-center rounded-md px-2 font-medium',
            isCompactMode
              ? 'cursor-grab touch-none gap-0.5 pl-1 active:cursor-grabbing'
              : 'cursor-default',
          )}
          onPointerDown={isCompactMode ? onDragStart : undefined}
        >
          {isCompactMode && (
            <MaterialSymbolsDragIndicator className="text-muted-foreground size-5" />
          )}
          Епізод {currentEpisode?.episode}
        </span>
      </div>
      <div
        className={cn(
          'absolute z-20 flex gap-2 duration-300',
          open ? 'top-4 right-4' : 'top-2 right-2',
          !uiShown && !open ? 'opacity-0' : 'opacity-100',
        )}
      >
        {isCompactMode ? (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              className={GLASS}
              aria-label="Вийти з мінірежиму"
              onClick={toggleMiniPlayer}
            >
              <MaterialSymbolsOpenInFullRounded />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={GLASS}
              aria-label="Закрити програвач"
              onClick={removePlayer}
            >
              <MaterialSymbolsCloseRounded />
            </Button>
          </>
        ) : (
          <SidebarTrigger
            variant="ghost"
            size="icon-sm"
            className={cn('hidden duration-300 md:inline-flex', !open && GLASS)}
          />
        )}
      </div>
    </>
  );
};

export default PlayerNavbar;
