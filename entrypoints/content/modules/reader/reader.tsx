import { ContentScriptContext } from '#imports';
import { Card, CardContent } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { FC, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { SidebarProvider } from '@/components/ui/sidebar';
import { QueryClientProvider } from '@tanstack/react-query';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { queryClient } from '../..';
import { ReaderProvider, useReaderContext } from './context/reader-context';
import ReaderSidebar from './sidebar/reader-sidebar';

export default function reader(
  ctx: ContentScriptContext,
  data: API.ReadData,
  slug: string,
) {
  return createShadowRootUi(ctx, {
    name: 'reader-ui',
    position: 'modal',
    zIndex: 100,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      wrapper.className =
        'size-full backdrop-blur-sm bg-black/60 flex items-center justify-center p-8';

      container.className = 'h-full';
      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <SidebarProvider className="h-full w-full">
            <ReaderProvider data={data} slug={slug}>
              <div
                className="fixed z-0 size-full"
                onClick={() =>
                  reader(ctx, data!, slug)!.then((x) => x!.remove())
                }
              />
              <Reader container={container} ctx={ctx} data={data} slug={slug} />
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
  slug: string;
}

export const Reader: FC<Props> = ({ container, ctx, data, slug }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [open, setOpen] = useState(false);

  const readerContext = useReaderContext();

  useEffect(() => {
    console.log(readerContext.state.imagesLoading);
  }, [readerContext.state.imagesLoading]);

  return (
    <Card
      className={cn(
        'relative z-10 flex size-full max-w-[1280px] overflow-hidden',
      )}
    >
      <div className="flex flex-1 flex-col">
        <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-0">
          <Carousel
            opts={{
              dragFree: false,
            }}
            plugins={[WheelGesturesPlugin()]}
            orientation="vertical"
            setApi={setApi}
            className="flex h-full gap-4"
          >
            <CarouselContent className="!m-0 h-full">
              {/* {readerContext.state.imagesLoading && (
                <div className="absolute top-0 h-full animate-pulse items-center justify-center bg-accent/90" />
              )} */}
              {readerContext.state.chapterImages.map((img_url) => {
                // const [image] = createResource<string>(() => loadImage(img_url));
                return (
                  <CarouselItem className="h-full py-2">
                    <div className="flex h-full items-center justify-center">
                      {/* <Show
                      when={image()}
                      fallback={
                        <div class="reader-image-skeleton animate-pulse rounded-md bg-white" />
                      }
                    > */}
                      <img
                        src={img_url}
                        alt="Chapter page"
                        loading="lazy"
                        className="h-full object-contain"
                      />
                      {/* </Show> */}
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </CardContent>
      </div>
      <ReaderSidebar container={container} ctx={ctx} slug={slug} />
    </Card>
  );
};
