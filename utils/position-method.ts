import type React from 'react';

export function resolvePositionMethod(
  container?:
    | HTMLElement
    | ShadowRoot
    | null
    | React.RefObject<HTMLElement | ShadowRoot | null>,
  explicit?: 'absolute' | 'fixed',
): 'absolute' | 'fixed' {
  if (explicit) return explicit;
  const el = container instanceof HTMLElement ? container : null;
  if (el?.getRootNode() instanceof ShadowRoot) return 'fixed';
  return 'absolute';
}
