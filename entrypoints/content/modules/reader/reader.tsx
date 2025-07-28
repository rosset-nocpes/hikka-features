import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { createRoot } from 'react-dom/client';
import { Card, CardContent } from '@/components/ui/card';
import type { CarouselApi } from '@/components/ui/carousel';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '../..';
import ChapterPages from './chapter-pages';
import {
  getRead,
  ReaderProvider,
  useReaderContext,
} from './context/reader-context';
import ReaderMobileToolbar from './mobile-toolbar/reader-mobile-toolbar';
import PageIndicator from './page-indicator';
import PageSwitcher from './page-switcher';
import ReaderNavbar from './reader-navbar';
import ScaleIndicator from './scale-indicator';
import ReaderSettings from './sidebar/reader-settings';
import ReaderSidebar from './sidebar/reader-sidebar';

export default function reader() {
  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'reader-ui',
    position: 'modal',
    zIndex: 100,
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      wrapper.className =
        'size-full sm:backdrop-blur-sm bg-black/60 flex items-center justify-center sm:p-8';

      container.className = 'h-full';
      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <SidebarProvider className="h-full w-full">
            <ReaderProvider container={container}>
              <div
                className="fixed z-0 size-full"
                onClick={() => reader().then((x) => x.remove())}
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
      elements?.then((x) => {
        x?.root.unmount();
        x?.wrapper.remove();
      });

      document.body.removeChild(document.getElementsByTagName('reader-ui')[0]);
      document.body.classList.toggle('h-full');
      document.body.classList.toggle('overflow-hidden');

      useReaderContext.getState().reset();
    },
  });
}

export const Reader = () => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  // const [isOpenSettings, setIsOpenSettings] = useState(false);
  // const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  const { data: mangaData } = useReadData();
  const { currentChapter, setChapter, imagesLoading } = useReaderContext();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!carouselApi) return;
    if (!mangaData) return;
    if (!currentChapter) return;

    const handleScroll = () => {
      const isTransitionPage = !carouselApi.canScrollNext();
      const isLastImage =
        carouselApi.selectedScrollSnap() ===
        carouselApi.scrollSnapList().length - 2;

      if (isTransitionPage && !imagesLoading) {
        const currentChapterIndex = mangaData.chapters.findIndex(
          (chapter) => chapter.id === currentChapter.id,
        );
        const nextChapter = mangaData.chapters[currentChapterIndex + 1];

        if (nextChapter) {
          setChapter(nextChapter);

          carouselApi.scrollTo(0);
        }
      }

      // if (isLastImage) {
      //   const current = mangaData.chapters.findIndex(
      //     (chap) => chap.id === currentChapter.id,
      //   );
      //   const lastRead = getRead() - 1;

      //   if (current === -1) return;

      //   if (lastRead - current) {
      //     (
      //       document.body.querySelector(
      //         'div.rounded-lg.border:nth-child(2) button',
      //       ) as HTMLButtonElement
      //     )?.click();
      //   }
      // }
    };

    carouselApi.on('scroll', handleScroll);

    return () => {
      carouselApi.off('scroll', handleScroll);
    };
  }, [carouselApi, mangaData, currentChapter, imagesLoading]);

  useEffect(() => {
    if (!carouselApi) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          carouselApi.scrollPrev();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          carouselApi.scrollNext();
          break;
        case 'Escape':
          e.preventDefault();
          reader().then((x) => x.remove());
          break;
      }
    };

    // const handleScroll = () => {
    //   if (carouselApi && carouselApi.selectedScrollSnap() !== selectedPageIndex)
    //     setSelectedPageIndex(carouselApi.selectedScrollSnap());
    // };

    window.addEventListener('keydown', handleKeyDown);
    // carouselApi.on('scroll', handleScroll);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // carouselApi.off('scroll', handleScroll);
    };
  }, [carouselApi]);

  return (
    <Card
      className={cn(
        'relative z-10 flex size-full overflow-hidden rounded-none sm:max-w-[1282px] sm:rounded-lg',
      )}
    >
      <ReaderMobileToolbar carouselApi={carouselApi} />

      <ReaderNavbar />

      <CardContent className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-0">
        <PageIndicator carouselApi={carouselApi} />
        <ScaleIndicator />
        <PageSwitcher carouselApi={carouselApi} />

        <AnimatePresence>
          {imagesLoading && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(64px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="absolute z-10 size-full"
            >
              <div className="size-full animate-pulse bg-accent/60" />
            </motion.div>
          )}
        </AnimatePresence>
        <ChapterPages
          setCarouselApi={setCarouselApi}
          scrollContainerRef={scrollContainerRef}
        />
      </CardContent>
      <ReaderSidebar
        carouselApi={carouselApi}
        scrollContainerRef={scrollContainerRef}
        // isOpenSettings={isOpenSettings}
        // setIsOpenSettings={setIsOpenSettings}
      />
    </Card>
  );
};
