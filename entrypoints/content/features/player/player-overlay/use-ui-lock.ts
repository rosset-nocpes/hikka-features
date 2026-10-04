import { useEffect } from 'react';

/** Keeps the player controls on screen while `active`, e.g. while a menu is open. */
export const useUiLock = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    useIFramePlayer.setState({ uiLocked: true, uiShown: true });
    return () => useIFramePlayer.setState({ uiLocked: false });
  }, [active]);
};
