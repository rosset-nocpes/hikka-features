import { type MouseEvent, useEffect } from 'react';

import { useIsMobile } from '@/components/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';

import { ModalUi } from '../../core/base-feature';
import { readingReporter } from './activity-reporter';
import ReaderNavbar from './components/reader-navbar';
import MangaRenderer from './components/renderers/manga-renderer';
import NovelRenderer from './components/renderers/novel-renderer';
import ReaderSidebar from './components/sidebar/reader-sidebar';
import ReaderMobileToolbar from './components/ui/mobile/reader-mobile-toolbar';
import PageSwitcher from './components/ui/page-switcher';
import { mangaMode, ReaderProvider, useReader } from './hooks/use-reader';
import useWakeLock from './hooks/use-wake-lock';
import { isOthersKey } from './keyboard';
import { MANGA_BACKGROUNDS } from './reader.constants';
import { MangaReadingMode, ReaderType } from './reader.enums';

const readerUi = new ModalUi({
  name: 'reader-ui',
  onMount(container, wrapper) {
    // No padding round the card in fullscreen.
    wrapper.className =
      'size-full md:backdrop-blur-xs bg-black/60 flex items-center justify-center md:p-8 md:has-data-fullscreen:p-0 duration-300';
    container.classList.add('h-full');
    Fonts.injectAllFonts();
    readingReporter.start();
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
    readingReporter.stop();
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

/** How much of the page's width at either side turns it on a tap. */
const TURN_ZONE = 0.3;

/**
 * Which way a tap at `x` of `width` turns manga pages: the left side goes
 * back and the right forward, the other way round when reading right to
 * left; 0 between them.
 */
const tapOffset = (x: number, width: number, rtl: boolean) => {
  const side = x < width * TURN_ZONE ? -1 : x > width * (1 - TURN_ZONE) ? 1 : 0;
  return (rtl ? -side : side) as -1 | 0 | 1;
};

const Reader = () => {
  const { settings, toggleBars, turnPage } = useReader();
  const mode = useReader(mangaMode);
  const isMobile = useIsMobile();
  useWakeLock(settings.keepAwake);

  const handlePageTap = (e: MouseEvent<HTMLElement>) => {
    if ((e.target as Element).closest(INTERACTIVE)) return;

    if (
      settings.type === ReaderType.Manga &&
      settings.tapToTurn &&
      mode !== MangaReadingMode.Strip
    ) {
      const rect = e.currentTarget.getBoundingClientRect();
      const offset = tapOffset(
        e.clientX - rect.left,
        rect.width,
        mode === MangaReadingMode.RightToLeft,
      );
      if (offset !== 0) {
        turnPage(offset);
        return;
      }
    }
    if (isMobile) toggleBars();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape in a menu or popup closes just that.
      if (e.key !== 'Escape' || isOthersKey(e)) return;
      e.preventDefault();
      closeReader();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const background =
    settings.type === ReaderType.Manga
      ? MANGA_BACKGROUNDS.find(({ value }) => value === settings.background)
      : undefined;

  return (
    <Card
      data-reader-card
      data-fullscreen={settings.fullscreen || undefined}
      className={cn(
        'relative z-10 flex size-full overflow-hidden rounded-none border-none duration-300 md:max-w-[1282px] md:rounded-lg md:border',
        settings.fullscreen && 'max-w-full! rounded-none! border-none!',
      )}
    >
      <ReaderMobileToolbar />

      <ReaderNavbar />

      <CardContent
        className={cn(
          'bg-card relative flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-0 transition-[background-color,color] duration-300',
          background?.className,
        )}
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
