import { useCallback, useState } from 'react';

/** The nearest ancestor that scrolls vertically. */
const scrollParentOf = (element: Element) => {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (/auto|scroll|overlay/u.test(getComputedStyle(node).overflowY)) {
      return node;
    }
  }
  return null;
};

/**
 * What scrolls a list (a scroll area, a drawer), found from the list once
 * it mounts, and how far down its content the list starts: a virtualizer's
 * `getScrollElement` and `scrollMargin`, its rows placed at
 * `translateY(start - scrollMargin)`.
 *
 * The virtualizer itself stays in the component: React Compiler skips
 * components that call `useVirtualizer`, which it can't memoize, but not
 * ones that call it through a hook of ours.
 */
export function useScrollParent() {
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const listRef = useCallback((list: HTMLElement | null) => {
    const parent = list && scrollParentOf(list);
    setScrollElement(parent);
    if (!list || !parent) return;
    setScrollMargin(
      list.getBoundingClientRect().top -
        parent.getBoundingClientRect().top +
        parent.scrollTop,
    );
  }, []);

  return { listRef, scrollElement, scrollMargin };
}
