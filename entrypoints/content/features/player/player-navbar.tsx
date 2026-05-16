import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';

import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

import { usePlayer } from './context/player-context';
import player from './player';

const PlayerNavbar = () => {
  const { currentEpisode } = usePlayer();
  const { uiShown } = useIFramePlayer();
  const { open } = useSidebar();

  return (
    <>
      <div
        className={cn(
          'absolute left-2 top-2 z-20 flex gap-2 duration-300',
          uiShown ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="bg-background/60 backdrop-blur-xl"
          onClick={() => player().then((x) => x.remove())}
        >
          <MaterialSymbolsCloseRounded />
        </Button>
        <span className="flex h-8 cursor-default items-center rounded-md bg-background/60 px-2 font-medium backdrop-blur-xl">
          Епізод {currentEpisode?.episode}
        </span>
      </div>
      <div
        className={cn(
          'absolute z-20 duration-300',
          open ? 'right-4 top-4' : 'right-2 top-2',
          !uiShown && !open ? 'opacity-0' : 'opacity-100',
        )}
      >
        <SidebarTrigger
          variant="ghost"
          size="icon-sm"
          className={cn(
            'hidden duration-300 md:inline-flex',
            !open && 'bg-background/60 backdrop-blur-xl',
          )}
        />
      </div>
    </>
  );
};

export default PlayerNavbar;
