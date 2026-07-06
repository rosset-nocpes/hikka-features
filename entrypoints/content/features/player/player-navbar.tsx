import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';

import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

import { usePlayer } from './context/player-context';
import { removePlayer } from './player';

const PlayerNavbar = () => {
  const { currentEpisode, miniPlayer, videoPiPActive } = usePlayer();
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
            className="bg-background/60 backdrop-blur-xl"
            onClick={removePlayer}
          >
            <MaterialSymbolsCloseRounded />
          </Button>
        )}
        <span
          className={cn(
            'bg-background/60 flex cursor-default items-center rounded-md font-medium backdrop-blur-xl',
            isCompactMode ? 'h-7 px-2 text-xs' : 'h-8 px-2',
          )}
        >
          Епізод {currentEpisode?.episode}
        </span>
      </div>
      <div
        className={cn(
          'absolute z-20 duration-300',
          isCompactMode && 'top-2 right-2',
          open ? 'top-4 right-4' : 'top-2 right-2',
          !uiShown && !open ? 'opacity-0' : 'opacity-100',
        )}
      >
        {isCompactMode ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="bg-background/60 backdrop-blur-xl"
            onClick={removePlayer}
          >
            <MaterialSymbolsCloseRounded />
          </Button>
        ) : (
          <SidebarTrigger
            variant="ghost"
            size="icon-sm"
            className={cn(
              'hidden duration-300 md:inline-flex',
              !open && 'bg-background/60 backdrop-blur-xl',
            )}
          />
        )}
      </div>
    </>
  );
};

export default PlayerNavbar;
