import { useEffect, useState } from 'react';

import { useIFramePlayer } from '@/hooks/use-iframe-player';
import {
  convexApi,
  type SkipAnswer,
  type SkipSegment,
} from '@/utils/convex-api';
import { convex, liveConvex } from '@/utils/convex-client';

import { followingEpisode, usePlayer } from '../context/player-context';

/** How often to look again while the episode is read, without a live connection. */
const POLL_MS = 3_000;
/** How often to look anyway with one: it may have dropped without a word. */
const BACKUP_POLL_MS = 15_000;
/** A live connection silent this long after starting isn't there (blocked WebSockets). */
const LIVE_WAIT_MS = 5_000;
/** A request unanswered this long is asked again (another may be stuck). */
const REQUEST_WAIT_MS = 15_000;
/** A read that takes longer than this has failed; stop waiting. */
const WAIT_FOR_MS = 10 * 60_000;
/** Seconds two copies may differ by and still be one cut (as the backend). */
const DURATION_TOLERANCE = 3;

const NONE: SkipSegment[] = [];

/**
 * The playing episode's opening and ending, from the backend, which finds
 * them in the audio of each upload. One it hasn't read yet is asked for
 * (which also moves one read ahead up the queue, and is asked again while
 * the queue is full) and followed until it has: live, and by asking again,
 * every few seconds when the live connection isn't there. Another
 * provider's copy serves when it is the same length as this player's;
 * another upload of the same provider's doesn't, as it may be another cut.
 * Once this one is settled, the next episode is asked for ahead, so it is
 * ready when it starts.
 */
export function useSkipSegments(): SkipSegment[] {
  const slug = usePlayer((state) => state.slug);
  const teamKey = usePlayer((state) => state.team?.key);
  const episode = usePlayer((state) => state.currentEpisode?.episode);
  const provider = usePlayer((state) => state.currentEpisode?.provider);
  const source = usePlayer((state) => state.currentEpisode?.video_url);
  const reported = useIFramePlayer((state) => state.duration);
  // A live stream's is infinite; the length is compared to the second.
  const duration =
    Number.isFinite(reported) && reported > 0 ? Math.round(reported) : 0;
  const knowsDuration = duration > 0;

  const key =
    slug && teamKey && episode !== undefined && provider && source
      ? JSON.stringify([slug, teamKey, episode, source])
      : undefined;
  const [answer, setAnswer] = useState<{ key: string; data: SkipAnswer }>();

  // Runs again once the player knows its length, or corrects it, to compare.
  useEffect(() => {
    if (!key) return;
    const [slug, teamKey, episode, source] = JSON.parse(key) as [
      string,
      string,
      number,
      string,
    ];
    const args = { slug, teamKey, episode };
    let finished = false;
    /**
     * The request for this upload: to send, under way, queued (a read is to
     * come, whatever an older answer about the jobs says), or declined.
     */
    let request: 'unsent' | 'sent' | 'queued' | 'declined' = 'unsent';
    /** The job of the read it queued: its failing is that read's end. */
    let accepted: string | undefined;
    /** When the result it asked about was read: a newer one is that read's. */
    let askedAt: number | undefined;
    let askedAhead = false;
    let following = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let liveTimer: ReturnType<typeof setTimeout> | undefined;
    let unfollow: (() => void) | undefined;

    const stopFollowing = () => {
      clearTimeout(liveTimer);
      unfollow?.();
      unfollow = undefined;
    };
    const finish = () => {
      finished = true;
      clearTimeout(pollTimer);
      clearTimeout(deadline);
      stopFollowing();
    };
    // A read that takes longer has failed, whatever the connection says.
    const deadline = setTimeout(finish, WAIT_FOR_MS);

    /**
     * Asks for the upload to be read, without holding anything up: looking
     * goes on meanwhile. A failed, stuck or "full" request is sent again on
     * a later look.
     */
    const ask = () => {
      request = 'sent';
      let settled = false;
      const again = () => {
        if (!settled && !finished) request = 'unsent';
        settled = true;
      };
      setTimeout(again, REQUEST_WAIT_MS);
      convex
        .mutation(
          convexApi.skip.request,
          { ...args, source, ...(duration > 0 && { duration }) },
          { skipQueue: true },
        )
        .then((reply) => {
          // Full: it waits as read ahead meanwhile, and asking again later
          // moves it up.
          if (reply?.full) return again();
          if (!settled) {
            request = reply ? 'queued' : 'declined';
            accepted = reply?.jobId;
          }
          settled = true;
        })
        .catch((error: unknown) => {
          console.error(error);
          again();
        });
    };

    /** Decides what to do with what the backend knows; true while waiting. */
    const settle = (data: SkipAnswer) => {
      if (finished) return false;
      setAnswer({ key, data });
      const own = data.results.find((result) => result.source === source);
      const job = data.jobs.find((candidate) => candidate.source === source);
      // An incomplete result shows meanwhile; the backend reads it again
      // once it's a day old.
      const needed =
        !own ||
        own.incomplete ||
        (duration > 0 &&
          Math.abs(own.duration - duration) > DURATION_TOLERANCE);
      // Once, even with a job there: it moves a read ahead up and asks
      // again for one that failed a while ago. The backend may decline (a
      // recent read, an upload it no longer lists).
      if (needed && request === 'unsent') {
        askedAt ??= own?.analyzedAt ?? 0;
        ask();
      }
      // Until a result, a decline with no read under way, or the read it
      // queued failing for good. A read asked for goes on whatever an older
      // answer shows (no job yet, the failed one it replaces), within the
      // deadline.
      const failed =
        job?.state === 'failed' && !!accepted && job.id === accepted;
      // A newer result with no read under way is this read's end, even one
      // still incomplete (read again on a later playback).
      const answered =
        !!own &&
        askedAt !== undefined &&
        own.analyzedAt > askedAt &&
        job?.state !== 'pending';
      const waiting =
        needed &&
        !failed &&
        !answered &&
        (request !== 'declined' || job?.state === 'pending');

      if (!waiting && !askedAhead) {
        askedAhead = true;
        const next = followingEpisode(usePlayer.getState());
        if (next) {
          // The backend does nothing if it has it, or has it queued.
          void convex
            .mutation(
              convexApi.skip.request,
              {
                slug,
                teamKey,
                episode: next.episode,
                source: next.video_url,
                ahead: true,
              },
              { skipQueue: true },
            )
            .catch(console.error);
        }
      }
      return waiting;
    };

    /**
     * Follows the episode over the live connection while it is read, so the
     * result shows the moment the worker reports it. Silent at first, it's
     * let go and polling speeds up.
     */
    const follow = async () => {
      try {
        const { client, release } = await liveConvex.acquire();
        if (finished) return release();
        let heard = false;
        const unsubscribe = client.onUpdate(
          convexApi.skip.segments,
          args,
          (data) => {
            heard = true;
            if (!settle(data)) finish();
          },
          stopFollowing,
        );
        unfollow = () => {
          unsubscribe();
          release();
        };
        liveTimer = setTimeout(() => {
          if (!heard) stopFollowing();
        }, LIVE_WAIT_MS);
      } catch {
        // Polling goes on alone.
      }
    };

    /** Asks over HTTP, and again in a while, until the episode is settled. */
    const poll = async () => {
      const data = await convex
        .query(convexApi.skip.segments, args)
        .catch(() => undefined);
      if (finished) return;
      if (data) {
        if (!settle(data)) return finish();
        if (!following) {
          following = true;
          void follow();
        }
      }
      pollTimer = setTimeout(poll, unfollow ? BACKUP_POLL_MS : POLL_MS);
    };

    void poll();
    return finish;
  }, [key, duration]);

  const results =
    answer && answer.key === key ? answer.data.results : undefined;
  if (!results) return NONE;
  const fits = (result: SkipAnswer['results'][number]) =>
    knowsDuration
      ? Math.abs(result.duration - duration) <= DURATION_TOLERANCE
      : result.source === source;
  return (
    (
      results.find((result) => result.source === source && fits(result)) ??
      results.find((result) => result.provider !== provider && fits(result))
    )?.segments ?? NONE
  );
}
