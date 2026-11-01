import { useVirtualizer } from '@tanstack/react-virtual';
import { type FC, type RefObject, useLayoutEffect, useMemo } from 'react';

import MissingDivider from '@/components/missing-divider';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { hikkaTracker } from '@/utils/hikka-tracker';

import type { Chapter } from '../../../reader.types';

import { missingBelow, sortChapters } from '../../../chapters';
import useReadData from '../../../hooks/use-read-data';
import { useReader } from '../../../hooks/use-reader';
import { ReaderContentMode, ReaderOrderBy } from '../../../reader.enums';
import ChapterRow from './chapter-row';

type Row = { id: string; chapter: Chapter } | { id: string; missing: number };

interface Props {
  scrollRef: RefObject<HTMLDivElement | null>;
}

const ChaptersView: FC<Props> = ({ scrollRef }) => {
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

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => ('missing' in rows[index]! ? 28 : 52),
    getItemKey: (index) => rows[index]!.id,
    overscan: 5,
  });

  // Keeps the open chapter in view.
  useLayoutEffect(() => {
    const index = rows.findIndex((row) => row.id === currentChapter?.id);
    if (index !== -1) {
      rowVirtualizer.scrollToIndex(index, {
        align: 'center',
        behavior: 'auto',
      });
    }
  }, [currentChapter, rowVirtualizer, rows]);

  if (!chapters) return;
  const progress = hikkaTracker.progress;

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
