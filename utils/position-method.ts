import type React from 'react';

/**
 * How a popup portalled into `container` positions itself: fixed inside a
 * feature's shadow root, absolute elsewhere, unless the caller says.
 */
export function resolvePositionMethod(
  container?:
    | HTMLElement
    | ShadowRoot
    | null
    | React.RefObject<HTMLElement | ShadowRoot | null>,
  explicit?: 'absolute' | 'fixed',
): 'absolute' | 'fixed' {
  if (explicit) return explicit;
  return container instanceof HTMLElement &&
    container.getRootNode() instanceof ShadowRoot
    ? 'fixed'
    : 'absolute';
}
