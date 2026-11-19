import { isPlayerOpen } from '../player';
import { useWatchTogether } from './use-watch-together';

/** The anime's page with the room's invite, which asks to join it. */
export const roomInviteUrl = (animeSlug: string, code: string) => {
  const url = new URL(`/anime/${animeSlug}`, window.location.origin);
  url.searchParams.set('room', code);
  return url;
};

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

  const url = roomInviteUrl(animeSlug, code);
  url.searchParams.set('join', '');
  window.location.assign(url.href);
};
