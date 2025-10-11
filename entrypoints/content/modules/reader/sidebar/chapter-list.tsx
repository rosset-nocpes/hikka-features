import { useVirtualizer } from '@tanstack/react-virtual';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import type { CarouselApi } from '@/components/ui/carousel';
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { getRead, useReaderContext } from '../context/reader-context';

interface Props {
  carouselApi: CarouselApi;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const ChapterList: FC<Props> = ({ carouselApi, scrollContainerRef }) => {
  const [isScrolled, setIsScrolled] = useState({ top: false, bottom: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  const { open } = useSidebar();
  const { data: mangaData } = useReadData();
  const { scrollMode, currentChapter, setChapter, sortBy } = useReaderContext();

  const handleSelectChapter = (value: API.ChapterData) => {
    setChapter(value);

    if (scrollMode) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      carouselApi?.scrollTo(0, true);
    }
  };

  const currentChapterRef = useRef<HTMLButtonElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: mangaData?.chapters.length || 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

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

  useEffect(() => {
    if (!currentChapter || !mangaData) return;

    const currentIndex = mangaData.chapters.findIndex(
      (chapter) => chapter.id === currentChapter.id,
    );

    if (currentIndex !== -1) {
      rowVirtualizer.scrollToIndex(currentIndex, {
        align: 'center',
        behavior: 'auto',
      });
    }
  }, [!!currentChapter]);

  const sorted = useMemo(() => {
    if (!mangaData?.chapters) return [];

    const { field, order } = sortBy;
    const multiplier = order === 'asc' ? 1 : -1;

    return [...mangaData.chapters].sort((a, b) => {
      if (field === 'chapter') {
        return (a.chapter - b.chapter) * multiplier;
      }

      if (field === 'date_upload') {
        const dateA = new Date(
          a.date_upload.split('.').reverse().join('-'),
        ).getTime();
        const dateB = new Date(
          b.date_upload.split('.').reverse().join('-'),
        ).getTime();
        return (dateA - dateB) * multiplier;
      }

      return 0;
    });
  }, [mangaData?.chapters, sortBy]);

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
                  onClick={() => handleSelectChapter(sorted[virtualItem.index])}
                  isActive={sorted[virtualItem.index].id === currentChapter?.id}
                  size="lg"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  ref={
                    sorted[virtualItem.index].id === currentChapter?.id
                      ? currentChapterRef
                      : null
                  }
                >
                  <div
                    className={cn(
                      'size-4 shrink-0 text-center duration-300',
                      open ? '-ml-6' : 'ml-0 w-full',
                    )}
                  >
                    <span
                      className={cn(
                        'block leading-4 duration-300',
                        open && '!text-transparent',
                        sorted[virtualItem.index].chapter <= getRead() &&
                          'text-muted-foreground',
                      )}
                    >
                      {sorted[virtualItem.index].chapter}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 truncate text-left leading-tight">
                    <span
                      className={cn(
                        sorted[virtualItem.index].chapter <= getRead() &&
                          'text-muted-foreground',
                      )}
                    >
                      Том {sorted[virtualItem.index].volume} Розділ{' '}
                      {sorted[virtualItem.index].chapter}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-xs">
                        {sorted[virtualItem.index].date_upload}
                      </span>
                      <div className="size-1 shrink-0 rounded-full bg-muted-foreground" />
                      <span className="truncate text-muted-foreground text-xs">
                        {sorted[virtualItem.index].scanlator}
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </div>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
};

export default ChapterList;
