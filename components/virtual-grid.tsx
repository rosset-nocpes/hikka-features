import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
  Fragment,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useState,
} from 'react';

interface Layout {
  columns: number;
  columnWidth: number;
  rowGap: number;
  /** The grid's top in the document, where its rows start. */
  top: number;
}

const sameLayout = (left: Layout, right: Layout) =>
  left.columns === right.columns &&
  left.columnWidth === right.columnWidth &&
  left.rowGap === right.rowGap &&
  left.top === right.top;

/** Reads the columns and gaps that the grid's classes give it. */
function useGridLayout(grid: HTMLElement | null) {
  const [layout, setLayout] = useState<Layout>({
    columns: 1,
    columnWidth: 0,
    rowGap: 0,
    top: 0,
  });

  useLayoutEffect(() => {
    if (!grid) return;
    const update = () => {
      const style = getComputedStyle(grid);
      const tracks = style.gridTemplateColumns.split(' ').filter(Boolean);
      const next = {
        columns: Math.max(tracks.length, 1),
        columnWidth: Number.parseFloat(tracks[0] ?? '') || 0,
        rowGap: Number.parseFloat(style.rowGap) || 0,
        top: grid.getBoundingClientRect().top + window.scrollY,
      };
      setLayout((current) => (sameLayout(current, next) ? current : next));
    };
    update();
    // The page above the grid moves it whenever it changes size.
    const observer = new ResizeObserver(update);
    observer.observe(grid);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [grid]);

  return layout;
}

interface Props<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** The grid's columns and gaps, as classes; every row copies them. */
  className: string;
  /** What a card has under its poster, for rows not measured yet. */
  captionHeight?: number;
}

/**
 * A grid of poster cards that renders only the rows near the window's
 * view, so a long one stays cheap. Columns come from `className`, so it
 * lays out as the same grid unvirtualized would.
 */
const VirtualGrid = <T,>({
  items,
  getKey,
  renderItem,
  className,
  captionHeight = 68,
}: Props<T>) => {
  // React Compiler knows `useVirtualizer` returns a mutable object it can't
  // memoize around, but not `useWindowVirtualizer`.
  'use no memo';
  const [grid, setGrid] = useState<HTMLDivElement | null>(null);
  const { columns, columnWidth, rowGap, top } = useGridLayout(grid);

  const virtualizer = useWindowVirtualizer({
    count: Math.ceil(items.length / columns),
    // Cards are a poster in hikka.io's 0.7 ratio over a caption.
    estimateSize: () => columnWidth / 0.7 + captionHeight,
    getItemKey: useCallback(
      (index: number) => `${columns}:${index}`,
      [columns],
    ),
    gap: rowGap,
    scrollMargin: top,
    overscan: 2,
  });
  // A grid out of view still gets its first rows as overscan; on a page of
  // many grids, only those near the view render any.
  const offset = virtualizer.scrollOffset ?? 0;
  const view = virtualizer.scrollRect?.height ?? window.innerHeight;
  const rows = virtualizer
    .getVirtualItems()
    .filter((row) => row.end > offset - view && row.start < offset + 2 * view);

  return (
    <div
      ref={setGrid}
      // Rows above the view are measured as they come back into it, and the
      // virtualizer moves the scroll for them; the browser shouldn't as well.
      className={cn('relative [overflow-anchor:none]', className)}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {rows.map((row) => (
        <div
          key={row.key}
          ref={virtualizer.measureElement}
          data-index={row.index}
          className="absolute inset-x-0 top-0 grid"
          style={{
            gridTemplateColumns: 'inherit',
            columnGap: 'inherit',
            transform: `translateY(${row.start - top}px)`,
          }}
        >
          {items
            .slice(row.index * columns, (row.index + 1) * columns)
            .map((item) => (
              <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
            ))}
        </div>
      ))}
    </div>
  );
};

export default VirtualGrid;
