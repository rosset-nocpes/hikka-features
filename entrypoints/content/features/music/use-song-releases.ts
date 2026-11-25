import type { FunctionReturnType } from 'convex/server';

import { useEffect } from 'react';

import { useLiveQuery } from '@/hooks/use-live-query';
import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';

import type { MusicTrack } from './animethemes';

/** An opening's or ending's release: its cover, album and store page. */
export type SongRelease = FunctionReturnType<
  typeof convexApi.songInfo.forAnime
>['songs'][number];

type Lookup = FunctionReturnType<typeof convexApi.songInfo.forAnime>;

/** Anime whose lookup this tab has asked for already. */
const requested = new Set<string>();

/** Never looked up, or long ago; one on its way keeps its place. */
const isDue = (lookup: Lookup, now: number) =>
  lookup.state === 'unknown' ||
  (lookup.state === 'done' && (lookup.refreshAt ?? 0) <= now);

/**
 * The covers and albums of the anime's songs that the backend has found,
 * followed live. Asks it to look them up when it hasn't, or long ago.
 */
export function useSongReleases(slug: string | undefined) {
  const lookup = useLiveQuery(
    convexApi.songInfo.forAnime,
    slug ? { animeSlug: slug } : 'skip',
  )?.data;

  useEffect(() => {
    if (!slug || !lookup || requested.has(slug)) return;
    if (!isDue(lookup, Date.now())) return;
    requested.add(slug);
    convex
      .mutation(convexApi.songInfo.request, { animeSlug: slug })
      .catch((error: unknown) => {
        requested.delete(slug);
        console.error(error);
      });
  }, [slug, lookup]);

  return lookup?.songs;
}

export const findRelease = (
  songs: SongRelease[] | undefined,
  { type, index }: { type: MusicTrack['type']; index: number },
) => songs?.find((song) => song.ostType === type && song.index === index);

/**
 * The track's release: a favourite's comes with it, others' from their
 * anime's lookup, which may finish while the track plays.
 */
export function useTrackRelease(track: MusicTrack | undefined) {
  const songs = useSongReleases(track?.release ? undefined : track?.slug);
  return track && (track.release ?? findRelease(songs, track));
}

/** The track's cover, else its anime's poster. */
export const artOf = (
  track: MusicTrack | undefined,
  release: Pick<SongRelease, 'cover'> | undefined,
) => release?.cover ?? track?.poster ?? undefined;
