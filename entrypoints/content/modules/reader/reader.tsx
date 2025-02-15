import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { SidebarProvider } from '@/components/ui/sidebar';
import useReadChapterData from '@/hooks/use-read-chapter-data';
import { QueryClientProvider } from '@tanstack/react-query';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import {
  Bell,
  Check,
  Globe,
  Home,
  Keyboard,
  Link,
  Lock,
  Menu,
  MessageCircle,
  Paintbrush,
  Settings,
  Video,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentScriptContext } from 'wxt/client';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import { queryClient } from '../..';
import SelectChapter from './select-chapter';

const reader = async (
  ctx: ContentScriptContext,
  data: API.ChapterResponse,
  slug: string,
) => {
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
          <div
            className="fixed z-0 size-full"
            onClick={() => reader(ctx, data!, slug)!.then((x) => x!.remove())}
          />

          <Reader container={container} ctx={ctx} data={data} slug={slug} />
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
};

interface Props {
  container: HTMLElement;
  ctx: ContentScriptContext;
  data: API.ChapterResponse;
  slug: string;
}

const data_nav = {
  nav: [
    { name: 'Notifications', icon: Bell },
    { name: 'Navigation', icon: Menu },
    { name: 'Home', icon: Home },
    { name: 'Appearance', icon: Paintbrush },
    { name: 'Messages & media', icon: MessageCircle },
    { name: 'Language & region', icon: Globe },
    { name: 'Accessibility', icon: Keyboard },
    { name: 'Mark as read', icon: Check },
    { name: 'Audio & video', icon: Video },
    { name: 'Connected accounts', icon: Link },
    { name: 'Privacy & visibility', icon: Lock },
    { name: 'Advanced', icon: Settings },
  ],
};

const Reader: FC<Props> = ({ container, ctx, data, slug }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [open, setOpen] = useState(false);
  const [isSidebarOpen, toggleSidebar] = useState<boolean>(false);

  const [readerState, setReaderState] = useState<ReaderState>(() => {
    const defaultChapterData = data.chapters[0];
    const defaultImages = [] as string[];

    return {
      chapterData: defaultChapterData,
      images: defaultImages,
    };
  });

  const {
    data: chapterImages,
    isLoading: chapterIsLoading,
    isError: chapterIsError,
    refetch: refetchChapterData,
  } = useReadChapterData(slug, readerState.chapterData.id);

  useEffect(() => {
    setReaderState((prev) => ({
      ...prev,
      images: chapterImages?.images ?? prev.images,
    }));
  }, [data]);

  return (
    <Card
      className={cn(
        'z-10 flex h-full max-h-full w-[1280px] flex-col overflow-hidden',
        // getTheatreState && 'h-full',
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            Читалка
            <div className="flex items-center gap-2">
              <SelectChapter
                readerState={readerState}
                setReaderState={setReaderState}
                data={data}
                container={container}
              />

              <div className="h-10 w-48 rounded-md bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-md"
              onClick={() => toggleSidebar(!isSidebarOpen)}
            >
              <Settings />
            </Button>
            <Button
              variant="ghost"
              size="icon-md"
              onClick={() => reader(ctx, data!, slug)!.then((x) => x!.remove())}
            >
              <MaterialSymbolsCloseRounded />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
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
            {chapterImages?.images.map((img_url) => {
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
                      className="h-full"
                    />
                    {/* </Show> */}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <SidebarProvider
            data-state={isSidebarOpen}
            className="!min-h-full !w-auto items-start"
          >
            <AnimatePresence>
              {/* {isSidebarOpen && ( */}
              {/* <motion.div
                  initial={{ transform: 'translateX(100%)' }}
                  animate={{ transform: 'translateX(0)' }}
                  exit={{ transform: 'translateX(100%)' }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                > */}
              {/* <ReaderSidebar /> */}
              {/* </motion.div> */}
              {/* )} */}
            </AnimatePresence>
            {/* <Sidebar
              collapsible="none"
              variant="floating"
              className="hidden min-h-0 rounded-lg border border-sidebar-border shadow md:flex"
            >
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {data_nav.nav.map((item) => (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton
                            asChild
                            isActive={item.name === 'Messages & media'}
                          >
                            <a href="#">
                              <item.icon />
                              <span>{item.name}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent> */}
            {/* </Sidebar> */}
          </SidebarProvider>
        </Carousel>
      </CardContent>
    </Card>
  );
};

export default reader;
