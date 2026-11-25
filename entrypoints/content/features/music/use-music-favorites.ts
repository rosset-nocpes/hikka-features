import type { FunctionReturnType } from 'convex/server';

import { create } from 'zustand';

import { useLiveQuery } from '@/hooks/use-live-query';
import { useSettings } from '@/hooks/use-settings';
import { account } from '@/utils/account';
import { convexApi } from '@/utils/convex-api';
import { liveConvex } from '@/utils/live-convex';

import type { MusicTrack } from './animethemes';

const HIKKA_CDN_URL = 'https://cdn.hikka.io/';

/** A favourite song, as the backend lists a user's. */
export type FavoriteSong = FunctionReturnType<
  typeof convexApi.musicFavorites.list
>[number];

/** Which song of which anime, the same for a track and a favourite. */
export const songId = (song: {
  slug?: string;
  animeSlug?: string;
  type?: string;
  ostType?: string;
  index: number;
}) =>
  `${song.slug ?? song.animeSlug}:${song.type ?? song.ostType}:${song.index}`;

/** A favourite as the music player plays it. */
export const favoriteTrack = (song: FavoriteSong): MusicTrack => ({
  // The same key as the anime page's track, so either shows as playing.
  key: `${song.animeSlug}:${song.ostType}:${song.index}:${song.title}`,
  slug: song.animeSlug,
  animeTitle: song.animeTitle,
  poster: song.poster,
  type: song.ostType,
  index: song.index,
  title: song.title,
  author: song.author,
  audio: song.audio,
  release: song.release,
});

/** Hearts clicked whose change hasn't reached the list yet, by `songId`. */
const usePending = create<Record<string, boolean>>(() => ({}));

const setPending = (id: string, liked: boolean | undefined) =>
  usePending.setState((pending) => {
    const { [id]: _previous, ...others } = pending;
    return liked === undefined ? others : { ...others, [id]: liked };
  });

/**
 * A user's favourite songs, followed live: anyone's (for their profile) or,
 * without `hikkaId`, the extension account's. Undefined until loaded, and
 * for the account while signed out.
 */
export function useFavoriteSongs(hikkaId?: string) {
  const own = useSettings((state) =>
    state.convexSession ? state.userData?.hikkaId : undefined,
  );
  const id = hikkaId ?? own;
  return useLiveQuery(
    convexApi.musicFavorites.list,
    id ? { hikkaId: id } : 'skip',
  );
}

/** Whether the account likes each song, with clicks shown before they land. */
export function useLikedSongs() {
  const songs = useFavoriteSongs()?.data;
  const pending = usePending();
  const liked = new Set(songs?.map(songId));
  return (track: MusicTrack) =>
    pending[songId(track)] ?? liked.has(songId(track));
}

/**
 * Likes `track` or stops liking it. Signed out, this signs in first: the
 * favourites belong to the extension account, as Hikka's do to its own.
 */
export async function setSongLiked(track: MusicTrack, liked: boolean) {
  const id = songId(track);
  setPending(id, liked);
  try {
    if (!account.signedIn) {
      await account.login();
      if (!account.signedIn) return;
    }
    if (liked) {
      await liveConvex.mutation(convexApi.musicFavorites.add, {
        song: {
          animeSlug: track.slug,
          ostType: track.type,
          index: track.index,
          title: track.title,
          author: track.author ?? undefined,
          animeTitle: track.animeTitle,
          // The backend keeps only Hikka's own posters.
          poster: track.poster?.startsWith(HIKKA_CDN_URL)
            ? track.poster
            : undefined,
          audio: track.audio,
        },
      });
    } else {
      await liveConvex.mutation(convexApi.musicFavorites.remove, {
        animeSlug: track.slug,
        ostType: track.type,
        index: track.index,
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    // The live list has the change by now, or it failed and shows the old one.
    setPending(id, undefined);
  }
}
