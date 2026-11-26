import { useEffect } from 'react';

/**
 * Keeps the screen from dimming or locking while `enabled`, asking again
 * whenever the tab comes back into view, since hiding it lets go.
 */
const useWakeLock = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    let lock: WakeLockSentinel | undefined;
    /** A request on its way, so a second one doesn't start beside it. */
    let requesting = false;
    let stopped = false;

    const request = async () => {
      if (
        requesting ||
        document.visibilityState !== 'visible' ||
        (lock && !lock.released)
      )
        return;
      requesting = true;
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (stopped) void sentinel.release();
        else lock = sentinel;
      } catch {
        // Refused, as on low battery: the screen just dims as usual.
      } finally {
        requesting = false;
      }
    };

    void request();
    document.addEventListener('visibilitychange', request);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', request);
      void lock?.release();
    };
  }, [enabled]);
};

export default useWakeLock;
