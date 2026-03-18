import { useVirtualizer } from '@tanstack/react-virtual';
import { type FC, type RefObject, useLayoutEffect, useMemo } from 'react';

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import type { Chapter } from '../../../reader.types';

import useReadData from '../../../hooks/use-read-data';
import { useReader } from '../../../hooks/use-reader';
import {
  ReaderContentMode,
  ReaderOrderBy,
  ReaderSortBy,
  ReaderType,
} from '../../../reader.enums';

interface Props {
  scrollRef: RefObject<HTMLDivElement | null>;
}

const ChaptersView: FC<Props> = ({ scrollRef }) => {
  const { data } = useReadData();
  const {
    container,
    settings,
    carouselApi,
    currentChapter,
    setChapter,
    getRead,
  } = useReader();

  const handleSelectChapter = (value: Chapter) => {
    setChapter(value);

    // todo: move to setChapter
    if (settings.type === ReaderType.Manga) {
      if (settings.scrollMode) {
        // scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        carouselApi?.scrollTo(0, true);
      }
    }
  };

  const rowVirtualizer = useVirtualizer({
    count: (data as any).chapters.length || 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

  // initial scroll to current chapter
  useLayoutEffect(() => {
    if (!currentChapter) return;
    if (data?.displayMode !== ReaderContentMode.Chapters) return;

    const currentIndex = data.chapters.findIndex(
      (chapter) => chapter.id === currentChapter.id,
    );

    if (currentIndex !== -1) {
      rowVirtualizer.scrollToIndex(currentIndex, {
        align: 'center',
        behavior: 'auto',
      });
    }
  }, [container]);

  const sorted = useMemo(() => {
    if (data?.displayMode !== ReaderContentMode.Chapters) return [];
    if (!data?.chapters) return [];

    const { field, order } = settings.sortBy;
    const multiplier = order === ReaderOrderBy.Ascending ? 1 : -1;

    return [...data.chapters].sort((a, b) => {
      if (field === ReaderSortBy.Chapter) {
        return (a.chapter - b.chapter) * multiplier;
      }

      if (field === ReaderSortBy.DateUpload) {
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
  }, [data, settings.sortBy]);

  if (data?.displayMode !== ReaderContentMode.Chapters) return;

  return (
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
              >
                <div className="flex flex-1 flex-col gap-1 truncate text-left leading-tight">
                  <span
                    // todo: change it
                    className={cn(
                      sorted[virtualItem.index].chapter <= getRead() &&
                        'text-muted-foreground',
                    )}
                  >
                    {sorted[virtualItem.index].volume &&
                      `Том ${sorted[virtualItem.index].volume} `}
                    Розділ {sorted[virtualItem.index].chapter}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {sorted[virtualItem.index].date_upload}
                    </span>
                    {sorted[virtualItem.index].translator && (
                      <>
                        <div className="size-1 shrink-0 rounded-full bg-muted-foreground" />
                        <span className="truncate text-xs text-muted-foreground">
                          {sorted[virtualItem.index].translator}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </div>
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default ChaptersView;
