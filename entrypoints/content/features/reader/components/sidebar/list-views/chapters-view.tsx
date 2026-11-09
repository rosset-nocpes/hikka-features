import { useVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useMemo } from 'react';

import MissingDivider from '@/components/missing-divider';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useScrollParent } from '@/hooks/use-scroll-parent';
import { hikkaTracker } from '@/utils/hikka-tracker';

import type { Chapter } from '../../../reader.types';

import { missingBelow, sortChapters } from '../../../chapters';
import useReadData from '../../../hooks/use-read-data';
import { useReader } from '../../../hooks/use-reader';
import { ReaderContentMode, ReaderOrderBy } from '../../../reader.enums';
import ChapterRow from './chapter-row';

type Row = { id: string; chapter: Chapter } | { id: string; missing: number };

const ChaptersView = () => {
  const { data } = useReadData();
  const { settings, currentChapter } = useReader();
  const { sortBy, translator } = settings;
  const chapters =
    data?.displayMode === ReaderContentMode.Chapters
      ? data.chapters
      : undefined;

  // A gap's divider sits between a chapter and its lower neighbour.
  const rows = useMemo(() => {
    const sorted = sortChapters(chapters ?? [], sortBy, translator);
    const missingCounts = missingBelow(sorted, sortBy);
    const descending = sortBy.order !== ReaderOrderBy.Ascending;

    return sorted.flatMap((chapter, index): Row[] => {
      const row = { id: chapter.id, chapter };
      const missing = missingCounts[index]!;
      if (!missing) return [row];

      const divider = { id: `missing-${chapter.id}`, missing };
      return descending ? [row, divider] : [divider, row];
    });
  }, [chapters, sortBy, translator]);

  const { listRef, scrollElement, scrollMargin } = useScrollParent();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: (index) => ('missing' in rows[index]! ? 24 : 48),
    getItemKey: (index) => rows[index]!.id,
    gap: 4,
    overscan: 8,
    scrollMargin,
    getScrollElement: () => scrollElement,
  });

  // Keeps the open chapter in view.
  const currentIndex = rows.findIndex((row) => row.id === currentChapter?.id);
  useLayoutEffect(() => {
    if (currentIndex === -1 || !scrollElement) return;
    rowVirtualizer.scrollToIndex(currentIndex, { align: 'center' });
  }, [currentIndex, rowVirtualizer, scrollElement]);

  if (!chapters) return;
  const progress = hikkaTracker.progress;

  return (
    <SidebarGroup>
      <SidebarMenu
        ref={listRef}
        className="relative"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const row = rows[virtualItem.index]!;

          return (
            <SidebarMenuItem
              key={virtualItem.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualItem.index}
              className="absolute inset-x-0 top-0"
              style={{
                transform: `translateY(${virtualItem.start - scrollMargin}px)`,
              }}
            >
              {'missing' in row ? (
                <MissingDivider count={row.missing} noun="chapter" />
              ) : (
                <ChapterRow
                  chapter={row.chapter}
                  read={row.chapter.chapter <= progress}
                  showVolume
                />
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default ChaptersView;
