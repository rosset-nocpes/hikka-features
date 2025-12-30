import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight } from 'lucide-react';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { getRead, useNovelReader } from '../context/novel-reader-context';

const ChapterList: FC = () => {
  const [isScrolled, setIsScrolled] = useState({ top: false, bottom: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  const { open } = useSidebar();
  const { data: noveldata } = useNovelData();
  const { currentChapter, setChapter, sortBy } = useNovelReader();

  const handleSelectChapter = (value: any) => {
    setChapter(value);
  };

  const currentChapterRef = useRef<HTMLButtonElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: noveldata?.length || 0,
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

  // useEffect(() => {
  //   if (!currentChapter || !noveldata) return;

  //   const currentIndex = noveldata.findIndex(
  //     (chapter) => chapter.chapter === currentChapter.chapter,
  //   );

  //   if (currentIndex !== -1) {
  //     rowVirtualizer.scrollToIndex(currentIndex, {
  //       align: "center",
  //       behavior: "auto",
  //     });
  //   }
  // }, [!!currentChapter]);

  // const sorted = useMemo(() => {
  //   if (!noveldata) return [];

  //   const { field, order } = sortBy;
  //   const multiplier = order === "asc" ? 1 : -1;

  //   return [...noveldata].sort((a, b) => {
  //     if (field === "chapter") {
  //       const volA = Number(a.volume ?? 0);
  //       const volB = Number(b.volume ?? 0);
  //       const chapA = Number(a.chapter ?? 0);
  //       const chapB = Number(b.chapter ?? 0);

  //       const volDiff = (volA - volB) * multiplier;
  //       if (volDiff !== 0) return volDiff;

  //       return (chapA - chapB) * multiplier;
  //     }

  //     if (field === "date_upload") {
  //       const dateA = new Date(
  //         a.date_upload.split(".").reverse().join("-"),
  //       ).getTime();
  //       const dateB = new Date(
  //         b.date_upload.split(".").reverse().join("-"),
  //       ).getTime();
  //       return (dateA - dateB) * multiplier;
  //     }

  //     return 0;
  //   });
  // }, [noveldata, sortBy]);

  if (!noveldata) return;

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
          {noveldata.displayMode === 'volumes' &&
            noveldata.volumes.map((volume) => (
              <Collapsible
                key={volume.number}
                asChild
                defaultOpen={volume.number === currentChapter?.volume}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="duration-200 group-data-[state=open]/collapsible:rounded-b-none group-data-[state=open]/collapsible:bg-sidebar-accent/50">
                      <span>Том {volume.number}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <SidebarMenuSub>
                      {volume.chapters.map((chapter) => (
                        <SidebarMenuSubItem key={chapter.id}>
                          <SidebarMenuButton
                            onClick={() => handleSelectChapter(chapter)}
                            isActive={
                              chapter.chapter === currentChapter?.chapter &&
                              chapter.volume === currentChapter?.volume
                            }
                            size="lg"
                            ref={
                              chapter.chapter === currentChapter?.chapter
                                ? currentChapterRef
                                : null
                            }
                          >
                            <div className="flex flex-1 flex-col gap-1 truncate text-left leading-tight">
                              <span
                                className={
                                  cn()
                                  // volume.index <= getRead() &&
                                  //   "text-muted-foreground",
                                }
                              >
                                Розділ {chapter.chapter}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground text-xs">
                                  {chapter.date_upload}
                                </span>
                                <div className="size-1 shrink-0 rounded-full bg-muted-foreground" />
                                <span className="truncate text-muted-foreground text-xs">
                                  {chapter.translator}
                                </span>
                              </div>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          {noveldata.displayMode === 'chapters' &&
            noveldata.chapters.map((chapter) => (
              <SidebarMenuItem key={chapter.id}>
                <SidebarMenuButton
                  onClick={() => handleSelectChapter(chapter)}
                  isActive={chapter.chapter === currentChapter?.chapter}
                  size="lg"
                  ref={
                    chapter.chapter === currentChapter?.chapter
                      ? currentChapterRef
                      : null
                  }
                >
                  <div className="flex flex-1 flex-col gap-1 truncate text-left leading-tight">
                    <span
                      className={
                        cn()
                        // volume.index <= getRead() &&
                        //   "text-muted-foreground",
                      }
                    >
                      Розділ {chapter.chapter}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-xs">
                        {chapter.date_upload}
                      </span>
                      <div className="size-1 shrink-0 rounded-full bg-muted-foreground" />
                      <span className="truncate text-muted-foreground text-xs">
                        {chapter.translator}
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
};

export default ChapterList;
