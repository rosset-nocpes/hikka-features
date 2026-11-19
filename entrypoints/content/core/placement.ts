/**
 * Moves for the extension's elements among hikka.io's. Each leaves an
 * element be where it already is: a move is a change that the page's
 * observers, the extension's too, would answer by placing it again.
 */

export function putAfter(anchor: Element, element: Element) {
  if (anchor.nextElementSibling !== element) anchor.after(element);
}

export function putBefore(anchor: Element, element: Element) {
  if (anchor.previousElementSibling !== element) anchor.before(element);
}

export function putFirst(parent: Element, element: Element) {
  if (parent.firstElementChild !== element) parent.prepend(element);
}

export function putLast(parent: Element, element: Element) {
  if (parent.lastElementChild !== element) parent.append(element);
}

/**
 * Right after `previous`, else right before `next`: between the same
 * neighbours as before. False when neither is there.
 */
export function putBetween(
  element: Element,
  previous: Element | null | undefined,
  next: Element | null | undefined,
) {
  if (previous) putAfter(previous, element);
  else if (next) putBefore(next, element);
  else return false;
  return true;
}
