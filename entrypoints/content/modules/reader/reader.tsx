import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { Card, CardContent } from '@/components/ui/card';
import type { CarouselApi } from '@/components/ui/carousel';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '../..';
import ChapterPages from './chapter-pages';
import { ReaderProvider, useReaderContext } from './context/reader-context';
import ReaderMobileToolbar from './mobile-toolbar/reader-mobile-toolbar';
import PageIndicator from './page-indicator';
import ReaderNavbar from './reader-navbar';
import ScaleIndicator from './scale-indicator';
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
    },
  });
}

export const Reader = () => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  // const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  const { data: mangaData } = useReadData();
  const { currentChapter, setChapter, setChapterImages, imagesLoading } =
    useReaderContext();

  useEffect(() => {
    if (!carouselApi) return;
    if (!mangaData) return;
    if (!currentChapter) return;

    const handleScroll = () => {
      const isLastImage = !carouselApi.canScrollNext();

      if (isLastImage && !imagesLoading) {
        const currentChapterIndex = mangaData.chapters.findIndex(
          (chapter) => chapter.id === currentChapter.id,
        );
        const nextChapter = mangaData.chapters[currentChapterIndex + 1];

        if (nextChapter) {
          setChapter(nextChapter);
          setChapterImages([], true);

          carouselApi.scrollTo(0);
        }
      }
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
          e.preventDefault();
          carouselApi.scrollPrev();
          break;
        case 'ArrowDown':
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
        'relative z-10 flex size-full overflow-hidden rounded-none sm:max-w-[1280px] sm:rounded-lg',
      )}
    >
      <ReaderMobileToolbar carouselApi={carouselApi} />

      <ReaderNavbar />

      <CardContent className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-0">
        <PageIndicator carouselApi={carouselApi} />
        <ScaleIndicator />

        {imagesLoading && (
          <div className="absolute z-10 size-full animate-pulse bg-accent" />
        )}
        <ChapterPages setCarouselApi={setCarouselApi} />
      </CardContent>
      <ReaderSidebar carouselApi={carouselApi} />
    </Card>
  );
};
