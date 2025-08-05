import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import type { CarouselApi } from '@/components/ui/carousel';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsFullscreenExitRounded from '~icons/material-symbols/fullscreen-exit-rounded';
import MaterialSymbolsFullscreenRounded from '~icons/material-symbols/fullscreen-rounded';
import { useReaderContext } from './context/reader-context';
import reader from './reader';

interface Props {
  carouselApi: CarouselApi;
  showControls?: boolean;
}

const ReaderNavbar: FC<Props> = ({ carouselApi, showControls = true }) => {
  const { open } = useSidebar();
  const {
    container,
    fullscreen,
    setFullscreen,
    sidebarMode,
    setSidebarMode,
    currentChapter,
  } = useReaderContext();

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      handleFullscreen();
    }
  };

  const handleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  // todo: move to context
  const wrapper = container?.querySelector('div');
  useEffect(() => {
    if (fullscreen) {
      document.documentElement.requestFullscreen();
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      wrapper?.classList.add('!p-0');
    } else {
      document.exitFullscreen();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      wrapper?.classList.remove('!p-0');
    }

    const re_init_carousel = setTimeout(() => carouselApi?.reInit(), 300);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      wrapper?.classList.remove('!p-0');
      clearTimeout(re_init_carousel);
    };
  }, [fullscreen]);

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
          'absolute top-2 right-2 z-20 flex gap-2 duration-300',
          !showControls && sidebarMode === 'offcanvas' && !open
            ? 'opacity-0'
            : 'opacity-100',
          open && 'gap-0',
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="bg-sidebar"
          onClick={handleFullscreen}
        >
          {fullscreen ? (
            <MaterialSymbolsFullscreenExitRounded />
          ) : (
            <MaterialSymbolsFullscreenRounded />
          )}
        </Button>
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
