import { isPlayerOpen } from '../player';
import { useWatchTogether } from './use-watch-together';

/**
 * Joins a room the user picked from an invite or a friend's listing: right
 * here when the player is open, which follows the room to its anime,
 * otherwise on the anime's page.
 */
export const openRoom = (animeSlug: string, code: string) => {
  if (isPlayerOpen()) {
    void useWatchTogether.getState().join(code);
    return;
  }

  const url = new URL(`/anime/${animeSlug}`, window.location.origin);
  url.searchParams.set('room', code);
  url.searchParams.set('join', '');
  window.location.assign(url.href);
};
