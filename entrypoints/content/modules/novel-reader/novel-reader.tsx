import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '../..';
import ChapterPage from './chapter-page';
import {
  NovelReaderProvider,
  useNovelReader,
} from './context/novel-reader-context';
import ReaderNavbar from './reader-navbar';
import NovelReaderSidebar from './sidebar/novel-reader-sidebar';

export default function novel_reader() {
  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'reader-ui',
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
            <NovelReaderProvider container={container}>
              <div
                className="fixed z-0 size-full"
                onClick={() => novel_reader().then((x) => x.remove())}
              />
              <NovelReader />
              <Toaster position="top-center" />
            </NovelReaderProvider>
          </SidebarProvider>
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
    onRemove: (elements) => {
      useNovelReader.getState().setFullscreen(false);

      elements?.then((x) => {
        x?.root.unmount();
        x?.wrapper.remove();
      });

      document.body.removeChild(document.getElementsByTagName('reader-ui')[0]);
      document.body.classList.toggle('h-full');
      document.body.classList.toggle('overflow-hidden');

      useNovelReader.getState().reset();
    },
  });
}

export const NovelReader = () => {
  const { fullscreen } = useNovelReader();

  return (
    <Card
      className={cn(
        'relative z-10 flex size-full overflow-hidden rounded-none border-none duration-300 md:max-w-[1282px] md:rounded-lg md:border',
        fullscreen && '!max-w-full !rounded-none !border-none',
      )}
    >
      {/*<ReaderMobileToolbar carouselApi={carouselApi} />*/}

      <ReaderNavbar />

      <CardContent className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-0">
        {/*<PageSwitcher carouselApi={carouselApi} />*/}

        <ChapterPage />
      </CardContent>
      <NovelReaderSidebar
      // scrollContainerRef={scrollContainerRef}
      // isOpenSettings={isOpenSettings}
      // setIsOpenSettings={setIsOpenSettings}
      />
    </Card>
  );
};
