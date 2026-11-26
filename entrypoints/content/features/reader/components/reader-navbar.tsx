import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsFullscreenExitRounded from '~icons/material-symbols/fullscreen-exit-rounded';
import MaterialSymbolsFullscreenRounded from '~icons/material-symbols/fullscreen-rounded';
import MaterialSymbolsTuneRounded from '~icons/material-symbols/tune-rounded';

import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

import { useReader } from '../hooks/use-reader';
import { closeReader } from '../reader';
import { ReaderType } from '../reader.enums';
import { ReaderSettingsPopover } from './sidebar/settings/reader-settings';

/** The reader's buttons over the page on desktops. */
const ReaderNavbar = () => {
  const { open } = useSidebar();
  const {
    settings,
    syncFullscreen,
    toggleFullscreen,
    carouselApi,
    currentChapter,
  } = useReader(
    useShallow((state) => ({
      settings: state.settings,
      syncFullscreen: state.syncFullscreen,
      toggleFullscreen: state.toggleFullscreen,
      carouselApi: state.carouselApi,
      currentChapter: state.currentChapter,
    })),
  );

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
          open ? '-top-8 opacity-0' : 'opacity-100',
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="bg-sidebar"
          aria-label="Закрити читалку"
          onClick={closeReader}
        >
          <MaterialSymbolsCloseRounded />
        </Button>
        {settings.type === ReaderType.Manga && (
          <span className="bg-sidebar flex h-8 cursor-default items-center rounded-md px-2 font-medium">
            {`Розділ ${currentChapter?.chapter}`}
            {currentChapter?.title ? `: ${currentChapter?.title}` : ''}
          </span>
        )}
      </div>
      <div
        className={cn(
          'absolute top-2 right-2 z-20 flex gap-2 opacity-100 duration-300',
          open && 'gap-0',
        )}
      >
        {/* The sidebar's foot has the settings while it's open. */}
        {!open && (
          <ReaderSettingsPopover
            side="bottom"
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                className="bg-sidebar data-popup-open:bg-accent"
                aria-label="Налаштування"
                title="Налаштування"
              >
                <MaterialSymbolsTuneRounded />
              </Button>
            }
          />
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="bg-sidebar"
          aria-label={
            settings.fullscreen ? 'Вийти з повного екрана' : 'Повний екран'
          }
          title={
            settings.fullscreen ? 'Вийти з повного екрана' : 'Повний екран'
          }
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
