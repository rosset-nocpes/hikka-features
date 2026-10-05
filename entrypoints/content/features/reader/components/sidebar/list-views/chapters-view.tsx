import { useVirtualizer } from '@tanstack/react-virtual';
import { type FC, type RefObject, useLayoutEffect, useMemo } from 'react';

import MissingDivider, { countMissing } from '@/components/missing-divider';
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

const isTranslatorMatch = (chapter: Chapter, translator: string) =>
  !translator ||
  chapter.translator
    .split(',')
    .map((value) => value.trim())
    .includes(translator);

const getDateTime = (value: string) =>
  new Date(value.split('.').reverse().join('-')).getTime();

type Row = { id: string; chapter: Chapter } | { id: string; missing: number };

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

  const sorted = useMemo(() => {
    if (data?.displayMode !== ReaderContentMode.Chapters) return [];
    if (!data?.chapters) return [];

    const { field, order } = settings.sortBy;
    const multiplier = order === ReaderOrderBy.Ascending ? 1 : -1;

    return data.chapters
      .filter((chapter) => isTranslatorMatch(chapter, settings.translator))
      .sort((a, b) => {
        if (field === ReaderSortBy.Chapter) {
          return (a.chapter - b.chapter) * multiplier;
        }

        if (field === ReaderSortBy.DateUpload) {
          const dateA = getDateTime(a.date_upload);
          const dateB = getDateTime(b.date_upload);
          return (dateA - dateB) * multiplier;
        }

        return 0;
      });
  }, [data, settings.sortBy, settings.translator]);

  // Gaps only mean something when sorted by number. Each one sits between a
  // chapter and its lower neighbour: above it ascending, below it descending.
  const rows = useMemo(() => {
    const { field, order } = settings.sortBy;
    const descending = order !== ReaderOrderBy.Ascending;

    return sorted.flatMap((chapter, index): Row[] => {
      const row = { id: chapter.id, chapter };
      const below = sorted[descending ? index + 1 : index - 1];
      const missing =
        field === ReaderSortBy.Chapter
          ? countMissing(chapter.chapter, below?.chapter)
          : 0;
      if (!missing) return [row];

      const divider = { id: `missing-${chapter.id}`, missing };
      return descending ? [row, divider] : [divider, row];
    });
  }, [sorted, settings.sortBy]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => ('missing' in rows[index]! ? 28 : 52),
    getItemKey: (index) => rows[index]!.id,
    overscan: 5,
  });

  // initial scroll to current chapter
  useLayoutEffect(() => {
    if (!currentChapter) return;
    if (data?.displayMode !== ReaderContentMode.Chapters) return;

    const currentIndex = rows.findIndex((row) => row.id === currentChapter.id);

    if (currentIndex !== -1) {
      rowVirtualizer.scrollToIndex(currentIndex, {
        align: 'center',
        behavior: 'auto',
      });
    }
  }, [container, currentChapter, data?.displayMode, rowVirtualizer, rows]);

  if (data?.displayMode !== ReaderContentMode.Chapters) return;

  return (
    <SidebarGroup>
      <SidebarMenu
        className="relative"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const row = rows[virtualItem.index]!;

          return (
            <SidebarMenuItem
              key={virtualItem.key}
              className="absolute inset-x-0 top-0"
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              {'missing' in row ? (
                <MissingDivider count={row.missing} noun="chapter" />
              ) : (
                <SidebarMenuButton
                  onClick={() => handleSelectChapter(row.chapter)}
                  isActive={row.chapter.id === currentChapter?.id}
                  size="lg"
                >
                  <div className="flex flex-1 flex-col gap-1 truncate text-left leading-tight">
                    <span
                      // todo: change it
                      className={cn(
                        row.chapter.chapter <= getRead() &&
                          'text-muted-foreground',
                      )}
                    >
                      {row.chapter.volume ? `Том ${row.chapter.volume} ` : null}
                      Розділ {row.chapter.chapter}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-xs">
                        {row.chapter.date_upload}
                      </span>
                      {row.chapter.translator && (
                        <>
                          <div className="bg-muted-foreground size-1 shrink-0 rounded-full" />
                          <span className="text-muted-foreground truncate text-xs">
                            {row.chapter.translator}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default ChaptersView;
