import type { RefObject } from 'react';

import { useEffect } from 'react';

import { usePlayer } from '../context/player-context';

/** Keeps the player controls on screen while `active`, e.g. while a menu is open. */
export const useUiLock = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    useIFramePlayer.setState({ uiLocked: true, uiShown: true });
    return () => useIFramePlayer.setState({ uiLocked: false });
  }, [active]);
};

/**
 * Placement of a toolbar menu: lined up with the toolbar group `anchor`
 * rather than its button, and kept inside the player.
 */
export const useToolbarMenuPosition = (
  anchor: RefObject<HTMLElement | null>,
  side: 'top' | 'bottom' = 'top',
) => {
  const { container, overlay } = usePlayer();
  return {
    container,
    anchor,
    side,
    sideOffset: side === 'top' ? 20 : 8,
    align: 'end' as const,
    collisionBoundary: overlay ?? undefined,
    collisionPadding: 8,
  };
};
