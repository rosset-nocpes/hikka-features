import { type FC, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsFullscreenExitRounded from '~icons/material-symbols/fullscreen-exit-rounded';
import MaterialSymbolsFullscreenRounded from '~icons/material-symbols/fullscreen-rounded';
import { useReader } from '../hooks/use-reader';
import reader from '../reader';
import { ReaderType } from '../reader.enums';

interface Props {
  showControls?: boolean;
}

const ReaderNavbar: FC<Props> = ({ showControls = true }) => {
  const { open } = useSidebar();
  const {
    settings,
    syncFullscreen,
    toggleFullscreen,
    carouselApi,
    currentChapter,
  } = useReader();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleSync = () => {
      syncFullscreen(!!document.fullscreenElement);

      if (settings.type === ReaderType.Manga) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => carouselApi?.reInit(), 500);
      }
    };

    document.addEventListener('fullscreenchange', handleSync);
    return () => {
      document.removeEventListener('fullscreenchange', handleSync);
      clearTimeout(timeoutId);
    };
  }, [syncFullscreen, carouselApi, settings.type]);

  return (
    <div className="hidden md:flex">
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
          onClick={() => reader(settings.type).then((x) => x.remove())}
        >
          <MaterialSymbolsCloseRounded />
        </Button>
        {settings.type === ReaderType.Manga && (
          <span className="flex h-8 cursor-default items-center rounded-md bg-sidebar px-2 font-medium">
            {`Розділ ${currentChapter?.chapter}`}
            {currentChapter?.title ? `: ${currentChapter?.title}` : ''}
          </span>
        )}
      </div>
      <div
        className={cn(
          'absolute top-2 right-2 z-20 flex gap-2 duration-300',
          !showControls && !open ? 'opacity-0' : 'opacity-100',
          open && 'gap-0',
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="bg-sidebar"
          onClick={toggleFullscreen}
        >
          {settings.fullscreen ? (
            <MaterialSymbolsFullscreenExitRounded />
          ) : (
            <MaterialSymbolsFullscreenRounded />
          )}
        </Button>
        <SidebarTrigger variant="ghost" size="icon-sm" className="bg-sidebar" />
      </div>
    </div>
  );
};

export default ReaderNavbar;
