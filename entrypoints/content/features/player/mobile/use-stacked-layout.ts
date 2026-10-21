import { useSyncExternalStore } from 'react';

import { usePlayer } from '../context/player-context';

const PORTRAIT_PHONE = '(max-width: 767px) and (orientation: portrait)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(PORTRAIT_PHONE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const isPortraitPhone = () => window.matchMedia(PORTRAIT_PHONE).matches;

/**
 * Whether the full player stacks the video above its episode panel, as on a
 * phone held upright. Fullscreen and the compact modes keep the video alone.
 */
export const useStackedLayout = () => {
  const portraitPhone = useSyncExternalStore(subscribe, isPortraitPhone);
  const full = usePlayer(
    (state) => !state.miniPlayer && !state.videoPiPActive && !state.fullscreen,
  );

  return portraitPhone && full;
};
