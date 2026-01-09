import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '../..';
import ReaderNavbar from './components/reader-navbar';
import MangaRenderer from './components/renderers/manga-renderer';
import NovelRenderer from './components/renderers/novel-renderer';
import ReaderSidebar from './components/sidebar/reader-sidebar';
import PageSwitcher from './components/ui/page-switcher';
import { ReaderProvider, useReader } from './hooks/use-reader';
import { ReaderType } from './reader.enums';

const MOUNT_TAG = 'reader-ui';

export default function reader(type: ReaderType) {
  return createShadowRootUi(usePageStore.getState().ctx, {
    name: MOUNT_TAG,
    position: 'modal',
    zIndex: 100,
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      wrapper.className =
        'size-full md:backdrop-blur-sm bg-black/60 flex items-center justify-center md:p-8 duration-300';

      container.className = 'h-full';
      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <SidebarProvider className="h-full w-full">
            <ReaderProvider type={type} container={container}>
              <div
                className="fixed z-0 size-full"
                onClick={() => reader(type).then((x) => x.remove())}
              />
              <Reader />
              <Toaster position="top-center" />
            </ReaderProvider>
          </SidebarProvider>
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
    onRemove: (elements) => {
      useReader.getState().setSettings({ fullscreen: false });

      elements?.then((x) => {
        x?.root.unmount();
        x?.wrapper.remove();
      });

      document.body.removeChild(document.getElementsByTagName('reader-ui')[0]);
      document.body.classList.toggle('h-full');
      document.body.classList.toggle('overflow-hidden');

      useReader.getState().reset();
    },
  });
}

export const Reader = () => {
  const { settings } = useReader();

  // const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          reader(settings.type).then((x) => x.remove());
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Card
      className={cn(
        'relative z-10 flex size-full overflow-hidden rounded-none border-none duration-300 md:max-w-[1282px] md:rounded-lg md:border',
        settings.fullscreen && '!max-w-full !rounded-none !border-none',
      )}
    >
      {/* todo */}
      {/*<ReaderMobileToolbar carouselApi={carouselApi} />*/}

      <ReaderNavbar />

      <CardContent className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-0">
        <PageSwitcher />
        {settings.type === ReaderType.Manga && <MangaRenderer />}
        {settings.type === ReaderType.Novel && <NovelRenderer />}
      </CardContent>
      <ReaderSidebar
      // scrollContainerRef={scrollContainerRef}
      />
    </Card>
  );
};
