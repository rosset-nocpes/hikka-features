import { reducedMotion } from '@/hooks/use-floating-card';
import { useSettings } from '@/hooks/use-settings';

import { putAfter, putBefore } from '../../core/placement';
import {
  BLOCK_TITLE,
  icon,
  logo,
  placement,
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
/** About as long as the site's rows take to settle after a drop. */
const DROP_MS = 250;

/** Marks our row and its placeholder, so neither counts as the site's. */
const OWN = 'data-hikka-features';
/**
 * The row the site's drag-and-drop lifts: it floats above the page while a
 * placeholder holds its place in the list.
 */
const SITE_DRAGGING = '[data-dnd-dragging]';

interface Column {
  side: Side;
  /** The dashed drop area holding the column's widgets. */
  box: HTMLElement;
}

type Point = { x: number; y: number };

/** Where our row was last seen: the site rows around it, nearest first. */
interface Seen {
  side: Side;
  above: string[];
  below: string[];
}

interface Drag {
  /** Holds the row's place while the row itself follows the pointer. */
  placeholder: HTMLElement;
  /** Where the pointer was as the drag began. */
  origin: Point;
  pointer: Point;
}

const save = (patch: Partial<ReturnType<typeof placement>>) =>
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

/** The layout chosen at the top of the dialog. */
const currentPreset = () =>
  document.querySelector<HTMLInputElement>('input[id^="preset-"]:checked')
    ?.value;

/**
 * The site's rows in a column, as laid out: not ours, nor one it is
 * dragging, whose placeholder stands in for it. The box also holds a hint
 * while it's empty.
 */
const siteItems = (box: Element) =>
  Array.from(box.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLDivElement &&
      !child.hasAttribute(OWN) &&
      !child.matches(SITE_DRAGGING),
  );

const slugOf = (item: Element | null | undefined) =>
  slugByTitle(item?.querySelector(':scope > span')?.textContent) ?? null;

const follows = (element: Element, other: Element) =>
  !!(element.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING);

/** The site rows above and below `own` in its column. */
function around(box: Element, own: Element) {
  const rows = siteItems(box);
  const split = rows.findIndex((row) => follows(own, row));
  return split === -1
    ? { above: rows, below: [] }
    : { above: rows.slice(0, split), below: rows.slice(split) };
}

const slugs = (rows: Element[]) =>
  rows.map(slugOf).filter((slug): slug is string => !!slug);

/** Into the column's slot `index`, i.e. after that many of its rows. */
function putAt(box: Element, index: number, element: Element) {
  const rows = siteItems(box);
  const next = rows[index];
  const last = rows.at(-1);
  if (next) putBefore(next, element);
  else if (last) putAfter(last, element);
  else if (box.firstElementChild !== element) box.prepend(element);
}

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
 * it drags between columns like the site's, moves with the arrow keys, hides
 * with ✕ and comes back from the hidden ones. The site can't store a widget
 * it doesn't know, so where it sits is kept by the extension, as the site
 * widgets right before and after it.
 */
export class LayoutDialog {
  private item?: HTMLElement;
  private addButton?: HTMLButtonElement;
  /** A "hidden" section of our own, while the site shows none. */
  private section?: HTMLElement;
  private readonly hiddenHints = new Set<HTMLElement>();
  private seen?: Seen;
  private preset?: string;
  private drag?: Drag;
  /** Ends the drag under way, if any. */
  private endDrag?: (drop: boolean) => void;
  /** Where focus goes once the row or the add button it moved to is in. */
  private focusTarget?: 'item' | 'add';
  private updating = false;

  update() {
    // Saving re-enters through the settings subscription; this pass
    // finishes the job with the saved values.
    if (this.updating) return;
    this.updating = true;
    try {
      this.sync();
    } finally {
      this.updating = false;
    }
  }

  /** Whether hikka.io is dragging one of its rows. */
  siteDragging() {
    return !!document.querySelector(SITE_DRAGGING);
  }

  stop() {
    this.endDrag?.(false);
    this.item?.remove();
    this.removeAddButton();
    for (const hint of this.hiddenHints) hint.style.removeProperty('display');
    this.hiddenHints.clear();
  }

  private sync() {
    const columns = findColumns();
    if (columns.length === 0) {
      // Closed; whatever we added went with it.
      this.endDrag?.(false);
      this.item = this.addButton = this.section = undefined;
      this.seen = this.preset = this.focusTarget = undefined;
      this.hiddenHints.clear();
      return;
    }

    const preset = currentPreset();
    if (preset && this.preset && preset !== this.preset) {
      this.resetPlacement(columns);
    }
    this.preset = preset;

    if (this.drag) {
      if (!this.item?.isConnected) this.endDrag?.(false);
      return this.toggleHints(columns);
    }

    if (placement().hidden) {
      this.item?.remove();
      this.seen = undefined;
      this.showAddButton(columns);
      if (this.focusTarget === 'add') this.addButton?.focus();
    } else {
      this.removeAddButton();
      const item = (this.item ??= this.createItem(columns));
      if (columns.some(({ box }) => box.contains(item))) {
        this.follow(item, columns);
      } else {
        this.place(item, columns);
      }
      this.remember(item, columns);
      if (this.focusTarget === 'item') item.focus();
    }
    this.focusTarget = undefined;
    this.toggleHints(columns);
  }

  private createItem(columns: Column[]) {
    const sample = columns.flatMap(({ box }) => siteItems(box))[0];
    const item = document.createElement('div');
    item.className =
      sample?.className.replace(/\bopacity-50\b/, '') || ITEM_CLASS;
    item.setAttribute(OWN, 'friends-activity');
    // Focusable like the site's rows, and unlike theirs, it moves by key.
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute(
      'aria-roledescription',
      sample?.getAttribute('aria-roledescription') || 'draggable',
    );
    item.setAttribute(
      'aria-keyshortcuts',
      'ArrowUp ArrowDown ArrowLeft ArrowRight',
    );

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
    remove.addEventListener('click', () => {
      if (item.contains(document.activeElement)) this.focusTarget = 'add';
      save({ hidden: true });
    });

    item.append(grip, title, logo('size-4 shrink-0'), remove);
    item.addEventListener('pointerdown', this.startDrag);
    item.addEventListener('keydown', this.handleKey);
    return item;
  }

  /** Next to the same neighbours as on the page, else at its column's end. */
  private place(item: HTMLElement, columns: Column[]) {
    const { side, after, before } = placement();
    const rows = columns.flatMap(({ box }) => siteItems(box));
    const row = (slug: string | null) =>
      slug ? rows.find((candidate) => slugOf(candidate) === slug) : undefined;
    const previous = row(after);
    const next = row(before);
    if (previous) return putAfter(previous, item);
    if (next) return putBefore(next, item);

    const target = resolveSide(
      side,
      columns.map((column) => column.side),
    );
    const { box } = columns.find((column) => column.side === target)!;
    putAt(box, Infinity, item);
  }

  /**
   * Stays put as the site moves its rows: React shifts ours along with
   * whatever it reorders, so it goes back after the nearest row above it
   * that didn't move (or before the nearest below). The row being dragged
   * is the one moving, wherever it was.
   */
  private follow(item: HTMLElement, columns: Column[]) {
    const seen = this.seen;
    const column = columns.find(({ box }) => box.contains(item));
    if (!seen || !column || column.side !== seen.side) return;
    const mover = slugOf(document.querySelector(SITE_DRAGGING));
    const rows = new Map(
      siteItems(column.box).map((row) => [slugOf(row), row] as const),
    );
    const steady = (slug: string) =>
      slug === mover ? undefined : rows.get(slug);

    for (const slug of seen.above) {
      const row = steady(slug);
      if (row) return putAfter(row, item);
    }
    for (const slug of seen.below) {
      const row = steady(slug);
      if (row) return putBefore(row, item);
    }
  }

  /** Notes where the row is, and saves it once the site isn't mid-drag. */
  private remember(item: HTMLElement, columns: Column[]) {
    const column = columns.find(({ box }) => box.contains(item));
    if (!column) return;
    const { above, below } = around(column.box, item);
    this.seen = {
      side: column.side,
      above: slugs(above).reverse(),
      below: slugs(below),
    };
    // Mid-drag the order is a preview the site may still take back.
    if (document.querySelector(SITE_DRAGGING)) return;

    const next = {
      side: column.side,
      after: this.seen.above[0] ?? null,
      before: this.seen.below[0] ?? null,
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

  /**
   * Choosing a layout puts every site widget back in its default column,
   * hidden ones too; the block goes back to its default spot with them.
   */
  private resetPlacement(columns: Column[]) {
    this.endDrag?.(false);
    this.item?.remove();
    this.seen = undefined;
    const defaults = useSettings.getInitialState().features.friendsActivity;
    save({
      ...defaults,
      side: resolveSide(
        defaults.side,
        columns.map((column) => column.side),
      ),
    });
  }

  /** "Drag here" stays on a column with only our row in it otherwise. */
  private toggleHints(columns: Column[]) {
    const own = this.drag?.placeholder ?? this.item;
    for (const { box } of columns) {
      const hint = box.querySelector<HTMLElement>(':scope > p');
      if (!hint) continue;
      if (own && box.contains(own)) {
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
    if (this.addButton?.contains(document.activeElement)) {
      this.focusTarget = 'item';
    }
    save({
      hidden: false,
      side,
      after: slugOf(siteItems(box).at(-1)),
      before: null,
    });
  };

  /**
   * Arrows move the row a slot at a time: up and down through its column
   * and on into the next, left and right across columns.
   */
  private handleKey = (event: KeyboardEvent) => {
    const item = this.item;
    if (!item || event.target !== item || this.drag) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const columns = findColumns();
    const index = columns.findIndex(({ box }) => box.contains(item));
    if (index === -1) return;
    const { box } = columns[index]!;
    const slot = around(box, item).above.length;
    const count = siteItems(box).length;
    const previous = columns[index - 1]?.box;
    const next = columns[index + 1]?.box;

    let target: [box: Element, slot: number] | undefined;
    switch (event.key) {
      case 'ArrowUp':
        if (slot > 0) target = [box, slot - 1];
        else if (previous) target = [previous, siteItems(previous).length];
        break;
      case 'ArrowDown':
        if (slot < count) target = [box, slot + 1];
        else if (next) target = [next, 0];
        break;
      case 'ArrowLeft':
        if (previous) target = [previous, slot];
        break;
      case 'ArrowRight':
        if (next) target = [next, slot];
        break;
      default:
        return;
    }
    event.preventDefault();
    if (!target) return;
    putAt(...target, item);
    // Moving it took focus away.
    item.focus();
    item.scrollIntoView({ block: 'nearest' });
    this.seen = undefined;
    this.update();
  };

  private startDrag = (event: PointerEvent) => {
    const item = this.item;
    if (
      !item ||
      this.drag ||
      event.button !== 0 ||
      (event.target as Element).closest('button') ||
      document.querySelector(SITE_DRAGGING)
    ) {
      return;
    }

    const origin = { x: event.clientX, y: event.clientY };
    const touch = event.pointerType === 'touch';
    let pointer = origin;
    let frame = 0;
    let hold = touch ? setTimeout(() => begin(), TOUCH_HOLD_MS) : undefined;

    const tick = () => {
      const drag = this.drag;
      if (!drag) return;
      this.scrollNear(drag.placeholder, drag.pointer);
      this.moveTo(drag.placeholder, drag.pointer);
      frame = requestAnimationFrame(tick);
    };

    const begin = () => {
      clearTimeout(hold);
      hold = undefined;
      this.drag = { placeholder: this.lift(item), origin, pointer };
      this.endDrag = end;
      window.addEventListener('keydown', cancelOnEscape, true);
      frame = requestAnimationFrame(tick);
    };

    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== event.pointerId) return;
      pointer = { x: moveEvent.clientX, y: moveEvent.clientY };
      if (this.drag) {
        moveEvent.preventDefault();
        this.drag.pointer = pointer;
        item.style.translate = `${pointer.x - origin.x}px ${pointer.y - origin.y}px`;
        return;
      }
      if (
        Math.hypot(pointer.x - origin.x, pointer.y - origin.y) < DRAG_DISTANCE
      ) {
        return;
      }
      // A finger that moves before holding is scrolling instead.
      if (touch) return end(false);
      begin();
    };

    // Before the dialog's own Escape, which would close it.
    const cancelOnEscape = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== 'Escape') return;
      keyEvent.preventDefault();
      keyEvent.stopImmediatePropagation();
      end(false);
    };

    const end = (drop: boolean) => {
      clearTimeout(hold);
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', cancelOnEscape, true);
      const drag = this.drag;
      if (!drag || this.endDrag !== end) return;
      this.drag = this.endDrag = undefined;
      this.settle(item, drag.placeholder, drop);
      this.seen = undefined;
      this.update();
    };
    const onUp = () => end(true);
    const onCancel = () => end(false);

    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  };

  /**
   * Lifts the row above the page where it is, as the site lifts its own,
   * and leaves a placeholder of its size in the list.
   */
  private lift(item: HTMLElement) {
    const rect = item.getBoundingClientRect();
    const placeholder = item.cloneNode(true) as HTMLElement;
    placeholder.removeAttribute('tabindex');
    placeholder.removeAttribute('role');
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.inert = true;
    placeholder.style.visibility = 'hidden';
    item.after(placeholder);

    // The top layer escapes the dialog's transform and scrolling clip.
    item.setAttribute('popover', 'manual');
    Object.assign(item.style, {
      position: 'fixed',
      inset: 'auto',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: '0',
      overflow: 'visible',
      color: 'inherit',
      opacity: '0.5',
      cursor: 'grabbing',
    });
    item.showPopover();
    document.body.style.userSelect = 'none';
    return placeholder;
  }

  /** Into the placeholder's place, or back where it was, gliding there. */
  private settle(item: HTMLElement, placeholder: HTMLElement, drop: boolean) {
    const from = item.getBoundingClientRect();
    if (item.matches(':popover-open')) item.hidePopover();
    item.removeAttribute('popover');
    for (const property of [
      'position',
      'inset',
      'left',
      'top',
      'width',
      'height',
      'margin',
      'overflow',
      'color',
      'opacity',
      'cursor',
      'translate',
    ]) {
      item.style.removeProperty(property);
    }
    document.body.style.removeProperty('user-select');
    if (drop && placeholder.isConnected) placeholder.replaceWith(item);
    else placeholder.remove();

    if (!item.isConnected || reducedMotion()) return;
    const to = item.getBoundingClientRect();
    item.animate(
      [
        {
          translate: `${from.left - to.left}px ${from.top - to.top}px`,
          opacity: 0.5,
        },
        { translate: '0 0', opacity: 1 },
      ],
      { duration: DROP_MS, easing: 'ease' },
    );
  }

  /** Into the closest column, before the first row below the pointer. */
  private moveTo(placeholder: HTMLElement, point: Point) {
    const columns = findColumns();
    if (columns.length === 0) return;
    const { box } = columns.reduce((closest, column) =>
      distance(column.box.getBoundingClientRect(), point) <
      distance(closest.box.getBoundingClientRect(), point)
        ? column
        : closest,
    );

    // Rows below the placeholder sit lower by its height; measure them as
    // if it weren't there, or it would swap back and forth across a
    // boundary.
    const inBox = placeholder.parentElement === box;
    const shift = inBox
      ? placeholder.offsetHeight +
        (parseFloat(getComputedStyle(box).rowGap) || 0)
      : 0;
    const rows = siteItems(box);
    const slot = rows.findIndex((row) => {
      const rect = row.getBoundingClientRect();
      const below = inBox && follows(placeholder, row);
      return point.y < rect.top - (below ? shift : 0) + rect.height / 2;
    });
    putAt(box, slot === -1 ? rows.length : slot, placeholder);
  }

  private scrollNear(element: Element, { y }: Point) {
    const scroller = scrollParent(element);
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    if (y < rect.top + SCROLL_EDGE) scroller.scrollTop -= SCROLL_STEP;
    else if (y > rect.bottom - SCROLL_EDGE) scroller.scrollTop += SCROLL_STEP;
  }
}
