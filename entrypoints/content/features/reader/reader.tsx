import { type MouseEvent, useEffect } from 'react';

import { useIsMobile } from '@/components/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';

import { ModalUi } from '../../core/base-feature';
import ReaderNavbar from './components/reader-navbar';
import MangaRenderer from './components/renderers/manga-renderer';
import NovelRenderer from './components/renderers/novel-renderer';
import ReaderSidebar from './components/sidebar/reader-sidebar';
import ReaderMobileToolbar from './components/ui/mobile/reader-mobile-toolbar';
import PageSwitcher from './components/ui/page-switcher';
import { ReaderProvider, useReader } from './hooks/use-reader';
import { ReaderType } from './reader.enums';

const readerUi = new ModalUi({
  name: 'reader-ui',
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

export const openReader = () => {
  document.body.classList.add('h-full', 'overflow-hidden');
  readerUi.open();
};

export const closeReader = () => readerUi.close();

/** Taps on these keep their own meaning rather than toggling the bars. */
const INTERACTIVE = 'button, a, input, img.cursor-zoom-in, .cursor-help';

const Reader = () => {
  const { settings, toggleBars } = useReader();
  const isMobile = useIsMobile();

  const handlePageTap = (e: MouseEvent) => {
    if (!isMobile) return;
    if ((e.target as Element).closest(INTERACTIVE)) return;
    toggleBars();
  };

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
      data-reader-card
      className={cn(
        'relative z-10 flex size-full overflow-hidden rounded-none border-none duration-300 md:max-w-[1282px] md:rounded-lg md:border',
        settings.fullscreen && 'max-w-full! rounded-none! border-none!',
      )}
    >
      <ReaderMobileToolbar />

      <ReaderNavbar />

      <CardContent
        className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-0"
        onClick={handlePageTap}
      >
        <PageSwitcher />
        {settings.type === ReaderType.Manga && <MangaRenderer />}
        {settings.type === ReaderType.Novel && <NovelRenderer />}
      </CardContent>
      <ReaderSidebar />
    </Card>
  );
};
