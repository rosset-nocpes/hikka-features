import { useVirtualizer } from '@tanstack/react-virtual';
import { Eye, Link, MoreHorizontal } from 'lucide-react';
import { FC } from 'react';
import { CarouselApi } from '@/components/ui/carousel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { getRead, useReaderContext } from '../context/reader-context';

interface Props {
  carouselApi: CarouselApi;
}

const ChapterList: FC<Props> = ({ carouselApi }) => {
  const [isScrolled, setIsScrolled] = useState({ top: false, bottom: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  const { open } = useSidebar();
  const { data: mangaData } = useReadData();
  const { container, currentChapter, setChapter } = useReaderContext();

  const handleSelectChapter = (value: API.ChapterData) => {
    setChapter(value);

    carouselApi?.scrollTo(0, true);
  };

  const currentChapterRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentChapterRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      setIsScrolled({
        top: element.scrollTop > 0,
        bottom: element.scrollTop + element.clientHeight < element.scrollHeight,
      });
    };

    element.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: mangaData?.chapters.length || 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 36,
    overscan: 5,
  });

  return (
    <SidebarContent
      ref={scrollRef}
      className={cn('group-data-[collapsible=icon]:overflow-auto', {
        'gradient-mask-t-90-d': isScrolled.top && isScrolled.bottom,
        'gradient-mask-t-90': isScrolled.top && !isScrolled.bottom,
        'gradient-mask-b-90': !isScrolled.top && isScrolled.bottom,
      })}
      style={{
        scrollbarWidth: 'none',
      }}
    >
      <SidebarGroup>
        <SidebarMenu>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => (
              <SidebarMenuItem key={virtualItem.index}>
                <SidebarMenuButton
                  onClick={() =>
                    handleSelectChapter(mangaData!.chapters[virtualItem.index])
                  }
                  isActive={
                    mangaData!.chapters[virtualItem.index].id ==
                    currentChapter!.id
                  }
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div
                    className={cn(
                      'size-4 shrink-0 text-center duration-300',
                      open ? '-ml-6 text-transparent' : 'ml-0',
                    )}
                  >
                    <span className="block leading-4">
                      {mangaData?.chapters[virtualItem.index].chapter}
                    </span>
                  </div>
                  <div className="grid flex-1 truncate text-left leading-tight">
                    <span>
                      Том {mangaData?.chapters[virtualItem.index].volume} Розділ{' '}
                      {mangaData?.chapters[virtualItem.index].chapter}
                    </span>
                  </div>
                  {mangaData!.chapters[virtualItem.index].chapter <=
                    getRead() && (
                    <Eye
                      className={cn(
                        'ml-auto transition-transform duration-200',
                        // !open && 'hidden',
                      )}
                    />
                  )}
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                      showOnHover
                      style={{
                        position: 'absolute',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-60 rounded-lg"
                    container={container}
                    // side={isMobile ? "bottom" : "right"}
                    align="end"
                    sideOffset={8}
                    alignOffset={-4}
                  >
                    <DropdownMenuItem>
                      <Link className="text-muted-foreground" />
                      <span>Copy Link</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
          </div>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
};

export default ChapterList;
