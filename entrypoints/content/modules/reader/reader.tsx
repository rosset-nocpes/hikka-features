import { QueryClientProvider } from '@tanstack/react-query';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { FC, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentScriptContext } from '#imports';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '../..';
import { ReaderProvider, useReaderContext } from './context/reader-context';
import ReaderMobileToolbar from './mobile-toolbar/reader-mobile-toolbar';
import PageIndicator from './page-indicator';
import ReaderNavbar from './reader-navbar';
import ReaderNextPages from './reader-next-pages';
import ReaderSidebar from './sidebar/reader-sidebar';

export default function reader(
  ctx: ContentScriptContext,
  data: API.ReadData,
  title: string,
) {
  return createShadowRootUi(ctx, {
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
            <ReaderProvider data={data} title={title}>
              <div
                className="fixed z-0 size-full"
                onClick={() =>
                  reader(ctx, data!, title)!.then((x) => x!.remove())
                }
              />
              <Reader
                container={container}
                ctx={ctx}
                data={data}
                title={title}
              />
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

interface Props {
  container: HTMLElement;
  ctx: ContentScriptContext;
  data: API.ReadData;
  title: string;
}

export const Reader: FC<Props> = ({ container, ctx, data, title }) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const readerContext = useReaderContext();

  useEffect(() => {
    if (!carouselApi) return;

    const handleScroll = () => {
      const isLastImage = !carouselApi.canScrollNext();

      if (isLastImage && !readerContext.state.imagesLoading) {
        const currentChapterIndex =
          readerContext.state.mangaData.chapters.findIndex(
            (chapter) => chapter.id === readerContext.state.currentChapter?.id,
          );
        const nextChapter =
          readerContext.state.mangaData.chapters[currentChapterIndex + 1];

        if (nextChapter) {
          readerContext.setState((prevState) => ({
            ...prevState,
            currentChapter: nextChapter,
            chapterImages: [],
            imagesLoading: true,
          }));

          carouselApi.scrollTo(0);
        }
      }
    };

    carouselApi.on('scroll', handleScroll);

    return () => {
      carouselApi.off('scroll', handleScroll);
    };
  }, [carouselApi, readerContext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          carouselApi?.scrollPrev();
          break;
        case 'ArrowDown':
          carouselApi?.scrollNext();
          break;
      }

      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carouselApi]);

  return (
    <Card
      className={cn(
        'relative z-10 flex size-full overflow-hidden rounded-none sm:max-w-[1280px] sm:rounded-lg',
      )}
    >
      <ReaderMobileToolbar ctx={ctx} container={container} title={title} />

      <ReaderNavbar container={container} ctx={ctx} data={data} title={title} />
      <PageIndicator carouselApi={carouselApi} />

      <div className="flex flex-1 flex-col">
        <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-0">
          <Carousel
            opts={{
              dragFree: false,
            }}
            plugins={[WheelGesturesPlugin()]}
            orientation="vertical"
            setApi={setCarouselApi}
            className="flex h-full gap-4"
          >
            <CarouselContent className="!m-0 h-full">
              {readerContext.state.imagesLoading && (
                <CarouselItem className="size-full animate-pulse bg-accent" />
              )}
              {readerContext.state.chapterImages.map((img_url) => {
                return (
                  <CarouselItem key={img_url} className="h-full py-2">
                    <div className="flex h-full items-center justify-center">
                      <img
                        src={img_url}
                        alt="Chapter page"
                        loading="lazy"
                        className="h-full object-contain"
                      />
                    </div>
                  </CarouselItem>
                );
              })}
              <ReaderNextPages />
            </CarouselContent>
          </Carousel>
        </CardContent>
      </div>
      <ReaderSidebar
        container={container}
        ctx={ctx}
        title={title}
        carouselApi={carouselApi}
      />
    </Card>
  );
};
