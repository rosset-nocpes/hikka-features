import { useDragControls } from 'motion/react';
import { type KeyboardEvent, type PointerEvent, useRef, useState } from 'react';

/**
 * A list of rows dragged by their handles (`Reorder.Group`). While a row is
 * dragged the order lives here and is saved once on drop: saving every swap
 * would let the storage listener reload an older order mid-drag.
 */
export function useReorderList<Item>(
  saved: Item[],
  keyOf: (item: Item) => string,
) {
  const [draft, setDraft] = useState<Item[]>();
  const draftRef = useRef<Item[]>(undefined);
  const listRef = useRef<HTMLUListElement>(null);

  return {
    order: draft ?? saved,
    listRef,
    /** Each row's `handle` for `useDragHandle`, which finds it again. */
    handleOf: keyOf,
    onReorder: (next: Item[]) => {
      draftRef.current = next;
      setDraft(next);
    },
    /** Ends a drag; `save` keeps the order it left, if it moved anything. */
    endDrag: (save: (order: Item[]) => void) => {
      if (draftRef.current) save(draftRef.current);
      draftRef.current = undefined;
      setDraft(undefined);
    },
    /** Moving a row in the DOM drops focus; this puts it back on its handle. */
    focusHandle: (item: Item) =>
      requestAnimationFrame(() =>
        listRef.current
          ?.querySelector<HTMLElement>(
            `[data-handle="${CSS.escape(keyOf(item))}"]`,
          )
          ?.focus(),
      ),
  };
}

interface DragHandleOptions {
  /** From the list's `handleOf`. */
  handle: string;
  index: number;
  count: number;
  /** Moves the row to `index`, from the keyboard. */
  onMove: (index: number) => void;
  onDragEnd: () => void;
}

/** The keys that move a row: by one, or to either end. */
export const HANDLE_KEYS_HINT =
  'Стрілки вгору та вниз змінюють позицію, Home і End ставлять першим чи останнім';

/**
 * A row of a `useReorderList` list: props for its `Reorder.Item`, which only
 * its handle drags, and for the handle, whose arrow, Home and End keys move
 * the row.
 */
export function useDragHandle({
  handle,
  index,
  count,
  onMove,
  onDragEnd,
}: DragHandleOptions) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  const last = count - 1;

  return {
    dragging,
    itemProps: {
      dragListener: false,
      dragControls: controls,
      onDragStart: () => setDragging(true),
      onDragEnd: () => {
        setDragging(false);
        onDragEnd();
      },
    },
    handleProps: {
      'data-handle': handle,
      onPointerDown: (event: PointerEvent) => controls.start(event),
      onKeyDown: (event: KeyboardEvent) => {
        const target = (
          {
            ArrowUp: index - 1,
            ArrowDown: index + 1,
            Home: 0,
            End: last,
          } as Record<string, number>
        )[event.key];
        if (target === undefined) return;
        event.preventDefault();
        if (target >= 0 && target <= last && target !== index) onMove(target);
      },
    },
  };
}
