/** Controls that use the keys themselves, and the popups holding them. */
const OWN_KEYS =
  'input, textarea, select, [contenteditable=true], [role=slider], [role=radio], [role=menu], [role=dialog], [data-slot=popover-content]';

/**
 * Whether the reader's shortcuts should leave `event` alone: something else
 * handled it, it's a browser shortcut, or it went to a control or popup. A
 * space also clicks a focused button.
 */
export const isOthersKey = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
    return true;

  // From the reader's shadow root, the event's target is its host.
  const target = event.composedPath()[0];
  if (!(target instanceof Element)) return false;
  return (
    !!target.closest(OWN_KEYS) ||
    (event.key === ' ' && !!target.closest('button, a'))
  );
};
