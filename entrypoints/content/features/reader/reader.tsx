import { useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';

import { createFeatureUi } from '../../core/base-feature';
import ReaderNavbar from './components/reader-navbar';
import MangaRenderer from './components/renderers/manga-renderer';
import NovelRenderer from './components/renderers/novel-renderer';
import ReaderSidebar from './components/sidebar/reader-sidebar';
import ReaderMobileToolbar from './components/ui/mobile/reader-mobile-toolbar';
import PageSwitcher from './components/ui/page-switcher';
import { ReaderProvider, useReader } from './hooks/use-reader';
import { ReaderType } from './reader.enums';

const MOUNT_TAG = 'reader-ui';
let readerUiPromise: ReturnType<typeof createFeatureUi> | undefined;

function reader() {
  readerUiPromise ??= createFeatureUi({
    name: MOUNT_TAG,
    position: 'modal',
    zIndex: 100,
    themeVariables: false,
    onMount(container, wrapper) {
      wrapper.className =
        'size-full md:backdrop-blur-xs bg-black/60 flex items-center justify-center md:p-8 duration-300';
      container.classList.add('h-full');
      Fonts.injectAllFonts();
    },
    render: (container) => (
      <SidebarProvider className="h-full w-full">
        <ReaderProvider container={container}>
          <div className="fixed z-0 size-full" onClick={closeReader} />
          <Reader />
        </ReaderProvider>
      </SidebarProvider>
    ),
    onRemove: () => {
      const { settings, toggleFullscreen } = useReader.getState();
      if (settings.fullscreen) toggleFullscreen();
      document.body.classList.remove('h-full', 'overflow-hidden');
      useReader.getState().reset();
    },
  });

  return readerUiPromise;
}

export const openReader = () => {
  document.body.classList.add('h-full', 'overflow-hidden');
  void reader().then((ui) => ui.mount());
};

export const closeReader = () => void reader().then((ui) => ui.remove());

const Reader = () => {
  const { settings } = useReader();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      closeReader();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Card
      className={cn(
        'relative z-10 flex size-full overflow-hidden rounded-none border-none duration-300 md:max-w-[1282px] md:rounded-lg md:border',
        settings.fullscreen && 'max-w-full! rounded-none! border-none!',
      )}
    >
      <ReaderMobileToolbar />

      <ReaderNavbar />

      <CardContent className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-0">
        <PageSwitcher />
        {settings.type === ReaderType.Manga && <MangaRenderer />}
        {settings.type === ReaderType.Novel && <NovelRenderer />}
      </CardContent>
      <ReaderSidebar />
    </Card>
  );
};
