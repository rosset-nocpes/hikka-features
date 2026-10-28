import { useSettings } from '@/hooks/use-settings';

import {
  BLOCK_TITLE,
  icon,
  logo,
  resolveSide,
  type Side,
  slugByTitle,
} from './site-layout';

const COLUMN_SIDES: Record<string, Side> = {
  'Ліва панель': 'left',
  Центр: 'center',
  'Права панель': 'right',
};
const HIDDEN_LABEL = 'Приховані';
/** Where the site puts a widget brought back from hidden, if it can. */
const DEFAULT_SIDE: Side = 'left';

/** The dialog's own looks, for when there is nothing of it to copy. */
const ITEM_CLASS =
  'surface flex cursor-grab touch-none items-center gap-2 rounded-lg border p-2';
const ITEM_TITLE_CLASS = 'flex-1 font-medium text-xs';
const REMOVE_CLASS =
  'flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground';
const ADD_CLASS =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-medium outline-none transition-all border border-border bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 h-8 px-2 py-1 text-sm gap-1.5';
const LABEL_CLASS = 'font-medium leading-tight text-muted-foreground text-xs';

/** Like the site's: a mouse drags after moving, a finger after holding. */
const DRAG_DISTANCE = 5;
const TOUCH_HOLD_MS = 200;
const SCROLL_EDGE = 48;
const SCROLL_STEP = 12;

interface Column {
  side: Side;
  /** The dashed drop area holding the column's widgets. */
  box: HTMLElement;
}

type Point = { x: number; y: number };
type Placement = ReturnType<
  typeof useSettings.getState
>['features']['friendsActivity'];

const placement = () => useSettings.getState().features.friendsActivity;
const save = (patch: Partial<Placement>) =>
  useSettings.getState().updateFeatureSettings('friendsActivity', patch);

/** The layout dialog's columns, found by the labels above them. */
function findColumns() {
  const columns: Column[] = [];
  for (const label of document.querySelectorAll('label')) {
    const side = COLUMN_SIDES[label.textContent?.trim() ?? ''];
    const box = label.parentElement?.nextElementSibling;
    if (
      side &&
      box instanceof HTMLElement &&
      box.classList.contains('border-dashed')
    ) {
      columns.push({ side, box });
    }
  }
  return columns;
}

/** The site's rows; the box also holds a hint while it's empty, and ours. */
const siteItems = (box: Element, own?: Element) =>
  Array.from(box.children).filter(
    (child): child is HTMLElement =>
      child !== own && child instanceof HTMLDivElement,
  );

const slugOf = (item: Element | undefined) =>
  slugByTitle(item?.querySelector(':scope > span')?.textContent) ?? null;

const distance = (rect: DOMRect, { x, y }: Point) =>
  Math.hypot(
    Math.max(rect.left - x, 0, x - rect.right),
    Math.max(rect.top - y, 0, y - rect.bottom),
  );

function scrollParent(element: Element) {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (
      /auto|scroll/.test(overflowY) &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
  }
  return undefined;
}

/**
 * Puts the block in hikka.io's "customise layout" dialog as one of its rows:
 * it drags between columns, hides with ✕ and comes back from the hidden
 * ones. The site can't store a widget it doesn't know, so where it sits is
 * kept by the extension, as the site widgets right before and after it.
 */
export class LayoutDialog {
  private item?: HTMLElement;
  private addButton?: HTMLButtonElement;
  /** A "hidden" section of our own, while the site shows none. */
  private section?: HTMLElement;
  private readonly hiddenHints = new Set<HTMLElement>();
  private dragging = false;

  update() {
    const columns = findColumns();
    if (columns.length === 0) {
      // Closed; whatever we added went with it.
      this.item = this.addButton = this.section = undefined;
      this.hiddenHints.clear();
      return;
    }

    if (placement().hidden) {
      this.item?.remove();
      this.showAddButton(columns);
    } else {
      this.removeAddButton();
      const item = (this.item ??= this.createItem(columns));
      if (!columns.some(({ box }) => box.contains(item))) {
        this.place(item, columns);
      } else if (!this.dragging) {
        // Keeps its slot as the site's rows move around it.
        this.remember(columns);
      }
    }
    this.toggleHints(columns);
  }

  stop() {
    this.item?.remove();
    this.removeAddButton();
    for (const hint of this.hiddenHints) hint.style.removeProperty('display');
    this.hiddenHints.clear();
  }

  private createItem(columns: Column[]) {
    const sample = columns.flatMap(({ box }) => siteItems(box))[0];
    const item = document.createElement('div');
    item.className =
      sample?.className.replace(/\bopacity-50\b/, '') || ITEM_CLASS;
    item.dataset.hikkaFeatures = 'friends-activity';

    const grip =
      sample?.querySelector(':scope > svg')?.cloneNode(true) ??
      icon('grip', 'size-4 shrink-0 text-muted-foreground');
    const title = document.createElement('span');
    title.className =
      sample?.querySelector(':scope > span')?.className || ITEM_TITLE_CLASS;
    title.textContent = BLOCK_TITLE;

    const sampleRemove = sample?.querySelector(':scope > button');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = sampleRemove?.className || REMOVE_CLASS;
    remove.setAttribute('aria-label', `Видалити ${BLOCK_TITLE}`);
    remove.append(
      sampleRemove?.querySelector('svg')?.cloneNode(true) ??
        icon('x', 'size-3.5'),
    );
    remove.addEventListener('click', () => save({ hidden: true }));

    item.append(grip, title, logo('size-4 shrink-0'), remove);
    item.addEventListener('pointerdown', this.startDrag);
    return item;
  }

  /** Next to the same neighbours as on the page, else at its column's end. */
  private place(item: HTMLElement, columns: Column[]) {
    const { side, after, before } = placement();
    const rows = columns.flatMap(({ box }) => siteItems(box, item));
    const previous = after && rows.find((row) => slugOf(row) === after);
    const next = before && rows.find((row) => slugOf(row) === before);
    if (previous) return previous.after(item);
    if (next) return next.before(item);

    const target = resolveSide(
      side,
      columns.map((column) => column.side),
    );
    const { box } = columns.find((column) => column.side === target)!;
    const last = siteItems(box, item).at(-1);
    if (last) last.after(item);
    else box.prepend(item);
  }

  private remember(columns: Column[]) {
    const item = this.item!;
    const column = columns.find(({ box }) => box.contains(item))!;
    const rows = Array.from(column.box.children).filter(
      (child) => child === item || child instanceof HTMLDivElement,
    );
    const index = rows.indexOf(item);
    const next = {
      side: column.side,
      after: slugOf(rows[index - 1]),
      before: slugOf(rows[index + 1]),
    };
    const current = placement();
    if (
      next.side !== current.side ||
      next.after !== current.after ||
      next.before !== current.before
    ) {
      save(next);
    }
  }

  /** "Drag here" stays on a column with only our row in it otherwise. */
  private toggleHints(columns: Column[]) {
    for (const { box } of columns) {
      const hint = box.querySelector<HTMLElement>(':scope > p');
      if (!hint) continue;
      if (this.item && box.contains(this.item)) {
        hint.style.display = 'none';
        this.hiddenHints.add(hint);
      } else if (this.hiddenHints.delete(hint)) {
        hint.style.removeProperty('display');
      }
    }
  }

  /** Among the site's hidden widgets, or in a section like theirs. */
  private showAddButton(columns: Column[]) {
    const scroller = columns[0]?.box.closest('.grid')?.parentElement;
    if (!scroller) return;
    const siteList = Array.from(scroller.querySelectorAll('label')).find(
      (label) =>
        label.textContent?.trim() === HIDDEN_LABEL &&
        !this.section?.contains(label),
    )?.nextElementSibling;

    let list: Element;
    if (siteList) {
      this.section?.remove();
      this.section = undefined;
      list = siteList;
    } else {
      this.section ??= this.createSection();
      if (this.section.parentElement !== scroller) {
        scroller.append(this.section);
      }
      list = this.section.lastElementChild!;
    }
    const button = (this.addButton ??= this.createAddButton(siteList));
    if (button.parentElement !== list) list.append(button);
  }

  private removeAddButton() {
    this.addButton?.remove();
    this.addButton = undefined;
    this.section?.remove();
    this.section = undefined;
  }

  private createSection() {
    const section = document.createElement('div');
    section.className = 'flex flex-col gap-2';
    const label = document.createElement('label');
    label.className = LABEL_CLASS;
    label.textContent = HIDDEN_LABEL;
    const list = document.createElement('div');
    list.className = 'flex flex-wrap gap-2';
    section.append(label, list);
    return section;
  }

  private createAddButton(siteList?: Element | null) {
    const sample = siteList?.querySelector('button');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = sample?.className || ADD_CLASS;
    button.append(icon('plus', 'size-3.5'), BLOCK_TITLE);
    button.addEventListener('click', this.restore);
    return button;
  }

  /** Back at the end of its default column, as the site adds its own. */
  private restore = () => {
    const columns = findColumns();
    if (columns.length === 0) return;
    const side = resolveSide(
      DEFAULT_SIDE,
      columns.map((column) => column.side),
    );
    const { box } = columns.find((column) => column.side === side)!;
    save({
      hidden: false,
      side,
      after: slugOf(siteItems(box).at(-1)),
      before: null,
    });
  };

  private startDrag = (event: PointerEvent) => {
    const item = this.item;
    if (
      !item ||
      event.button !== 0 ||
      (event.target as Element).closest('button')
    ) {
      return;
    }

    const origin = { x: event.clientX, y: event.clientY };
    const touch = event.pointerType === 'touch';
    let pointer = origin;
    let frame = 0;
    let hold = touch ? setTimeout(() => begin(), TOUCH_HOLD_MS) : undefined;
    const bodySelect = document.body.style.userSelect;

    const tick = () => {
      this.scrollNear(pointer);
      this.moveTo(pointer);
      frame = requestAnimationFrame(tick);
    };

    const begin = () => {
      clearTimeout(hold);
      hold = undefined;
      this.dragging = true;
      item.style.cursor = 'grabbing';
      item.style.outline =
        '2px solid color-mix(in oklab, var(--primary-foreground) 60%, transparent)';
      item.style.outlineOffset = '-1px';
      document.body.style.userSelect = 'none';
      frame = requestAnimationFrame(tick);
    };

    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== event.pointerId) return;
      pointer = { x: moveEvent.clientX, y: moveEvent.clientY };
      if (this.dragging) return moveEvent.preventDefault();
      if (
        Math.hypot(pointer.x - origin.x, pointer.y - origin.y) < DRAG_DISTANCE
      ) {
        return;
      }
      // A finger that moves before holding is scrolling instead.
      if (touch) return end();
      begin();
    };

    const end = () => {
      clearTimeout(hold);
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (!this.dragging) return;
      this.dragging = false;
      item.style.removeProperty('cursor');
      item.style.removeProperty('outline');
      item.style.removeProperty('outline-offset');
      document.body.style.userSelect = bodySelect;
      this.update();
    };

    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  /** Into the closest column, before the first row below the pointer. */
  private moveTo(point: Point) {
    const item = this.item;
    const columns = findColumns();
    if (!item || columns.length === 0) return;
    const { box } = columns.reduce((closest, column) =>
      distance(column.box.getBoundingClientRect(), point) <
      distance(closest.box.getBoundingClientRect(), point)
        ? column
        : closest,
    );

    // Rows below ours sit lower by its height; measure them as if it
    // weren't there, or it would swap back and forth across a boundary.
    const shift =
      item.parentElement === box
        ? item.offsetHeight + (parseFloat(getComputedStyle(box).rowGap) || 0)
        : 0;
    const rows = siteItems(box, item);
    const next = rows.find((row) => {
      const rect = row.getBoundingClientRect();
      const below =
        item.parentElement === box &&
        item.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING;
      return point.y < rect.top - (below ? shift : 0) + rect.height / 2;
    });

    if (next) {
      if (item.nextElementSibling !== next) next.before(item);
    } else {
      const last = rows.at(-1);
      if (last) {
        if (last.nextElementSibling !== item) last.after(item);
      } else if (item.parentElement !== box) {
        box.prepend(item);
      }
    }
  }

  private scrollNear({ y }: Point) {
    const scroller = this.item && scrollParent(this.item);
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    if (y < rect.top + SCROLL_EDGE) scroller.scrollTop -= SCROLL_STEP;
    else if (y > rect.bottom - SCROLL_EDGE) scroller.scrollTop += SCROLL_STEP;
  }
}
