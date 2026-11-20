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
/** A read that takes longer than this has failed; stop waiting. */
const WAIT_FOR_MS = 10 * 60_000;
/** Seconds two copies may differ by and still be one cut (as the backend). */
const DURATION_TOLERANCE = 3;

const NONE: SkipSegment[] = [];

/**
 * The playing episode's opening and ending, from the backend, which finds
 * them in the audio. An episode it hasn't read yet is asked for once and
 * followed live until it has. Another provider's copy serves when it is
 * the same length as this player's. Once this one is settled, the next
 * episode is asked for ahead, so it is ready when it starts.
 */
export function useSkipSegments(): SkipSegment[] {
  const slug = usePlayer((state) => state.slug);
  const teamKey = usePlayer((state) => state.team?.key);
  const episode = usePlayer((state) => state.currentEpisode?.episode);
  const provider = usePlayer((state) => state.currentEpisode?.provider);
  const duration = useIFramePlayer((state) => state.duration);
  const knowsDuration = duration > 0;

  const key =
    slug && teamKey && episode !== undefined && provider
      ? JSON.stringify([slug, teamKey, episode, provider])
      : undefined;
  const [answer, setAnswer] = useState<{ key: string; data: SkipAnswer }>();

  // Runs again once the player knows its length, to compare it.
  useEffect(() => {
    if (!key) return;
    const [slug, teamKey, episode, provider] = JSON.parse(key) as [
      string,
      string,
      number,
      string,
    ];
    const args = { slug, teamKey, episode };
    const started = Date.now();
    let cancelled = false;
    let requested = false;
    let askedAhead = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unfollow: (() => void) | undefined;

    /** Decides what to do with what the backend knows; true while waiting. */
    const settle = async (data: SkipAnswer) => {
      setAnswer({ key, data });
      const playing = useIFramePlayer.getState().duration;
      const own = data.results.find((result) => result.provider === provider);
      const job = data.jobs.find(
        (candidate) => candidate.provider === provider,
      );
      const stale =
        !!own &&
        playing > 0 &&
        Math.abs(own.duration - playing) > DURATION_TOLERANCE;
      // Once per episode: the backend may decline (a recent read, a provider
      // it no longer lists), and then there is no job to wait for.
      const asking = (!own || stale) && !job && !requested;
      if (asking) {
        requested = true;
        await convex
          .mutation(convexApi.skip.request, {
            ...args,
            provider,
            ...(playing > 0 && { duration: playing }),
          })
          .catch(console.error);
      }
      const waiting =
        (asking || job?.state === 'pending') &&
        Date.now() - started < WAIT_FOR_MS;

      if (!waiting && !askedAhead) {
        askedAhead = true;
        const next = followingEpisode(usePlayer.getState());
        if (next) {
          // The backend does nothing if it has it, or has it queued.
          void convex
            .mutation(convexApi.skip.request, {
              slug,
              teamKey,
              episode: next.episode,
              provider: next.provider,
              ahead: true,
            })
            .catch(console.error);
        }
      }
      return waiting;
    };

    const stopFollowing = () => {
      unfollow?.();
      unfollow = undefined;
    };

    /** Asks again every few seconds: when the live connection isn't there. */
    const poll = async () => {
      const data = await convex
        .query(convexApi.skip.segments, args)
        .catch(() => undefined);
      if (cancelled || !data) return;
      if (await settle(data)) timer = setTimeout(poll, POLL_MS);
    };

    /**
     * Follows the episode over the live connection while it is read, so the
     * result shows the moment the worker reports it, then lets go.
     */
    const follow = async () => {
      try {
        const { client, release } = await liveConvex.acquire();
        if (cancelled) return release();
        const unsubscribe = client.onUpdate(
          convexApi.skip.segments,
          args,
          (data) => {
            void settle(data).then((waiting) => {
              if (!waiting) stopFollowing();
            });
          },
          () => {
            stopFollowing();
            if (!cancelled) void poll();
          },
        );
        unfollow = () => {
          unsubscribe();
          release();
        };
      } catch {
        if (!cancelled) void poll();
      }
    };

    void (async () => {
      const data = await convex
        .query(convexApi.skip.segments, args)
        .catch(() => undefined);
      if (cancelled || !data) return;
      if (await settle(data)) void follow();
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopFollowing();
    };
  }, [key, knowsDuration]);

  const results =
    answer && answer.key === key ? answer.data.results : undefined;
  if (!results) return NONE;
  const fits = (result: SkipAnswer['results'][number]) =>
    knowsDuration
      ? Math.abs(result.duration - duration) <= DURATION_TOLERANCE
      : result.provider === provider;
  return (
    (
      results.find((result) => result.provider === provider && fits(result)) ??
      results.find(fits)
    )?.segments ?? NONE
  );
}
