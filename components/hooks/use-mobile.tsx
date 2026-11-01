import { useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

export const useIsMobile = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
  );
