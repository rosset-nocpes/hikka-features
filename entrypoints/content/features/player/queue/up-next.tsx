import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type FC, useEffect, useState } from 'react';
import { create } from 'zustand';
import MaterialSymbolsSkipNextRounded from '~icons/material-symbols/skip-next-rounded';

import { Button } from '@/components/ui/button';
import { useHikkaContent } from '@/hooks/use-hikka';

import type { QueueItem } from './use-queue';

import { followingEpisode, usePlayer } from '../context/player-context';
import { playNext } from '../player-iframe-effects';
import { activeQueue, useActiveQueue } from './use-active-queue';

/** How long the next episode waits, so the user can stop it. */
const COUNTDOWN_MS = 8_000;

/** What plays next: the queue's first episode, else the anime's next one. */
export interface NextEpisode {
  slug: string;
  episode: number;
  /** The team's key in the watch data; empty for providers without teams. */
  team: string;
  queued: boolean;
}

/** The queue's first episode, else the player's anime's following one. */
const nextOf = (
  queued: QueueItem | undefined,
  { slug, team }: { slug?: string; team?: API.TeamData },
  following?: API.EpisodeData,
): NextEpisode | undefined => {
  if (queued) return { ...queued, queued: true };
  if (!slug || !following) return undefined;
  return {
    slug,
    episode: following.episode,
    team: team?.title ?? '',
    queued: false,
  };
};

/** What follows the playing episode, if anything does. */
export const nextEpisode = () => {
  const player = usePlayer.getState();
  return nextOf(activeQueue().items[0], player, followingEpisode(player));
};

export const useNextEpisode = () => {
  const queued = useActiveQueue().items[0];
  const slug = usePlayer((state) => state.slug);
  const team = usePlayer((state) => state.team);
  const following = usePlayer(followingEpisode);
  return nextOf(queued, { slug, team }, following);
};

interface UpNextState {
  /**
   * Once an episode ends, what follows it is offered: counting down to it
   * with autoplay, else waiting for the user.
   */
  status: 'idle' | 'counting' | 'waiting';
  /** When the countdown plays it, as a `Date.now()` time. */
  playsAt?: number;
}

export const useUpNext = create<UpNextState>(() => ({ status: 'idle' }));

let timer: ReturnType<typeof setTimeout> | undefined;

export const upNext = {
  /** Offers what follows the episode that just ended, if anything does. */
  offer: () => {
    upNext.cancel();
    if (!nextEpisode()) return;
    if (!useSettings.getState().features.player.autoplayNext) {
      useUpNext.setState({ status: 'waiting' });
      return;
    }
    useUpNext.setState({
      status: 'counting',
      playsAt: Date.now() + COUNTDOWN_MS,
    });
    timer = setTimeout(upNext.play, COUNTDOWN_MS);
  },
  cancel: () => {
    clearTimeout(timer);
    timer = undefined;
    if (useUpNext.getState().status !== 'idle') {
      useUpNext.setState({ status: 'idle', playsAt: undefined });
    }
  },
  play: () => {
    upNext.cancel();
    void playNext();
  },
};

/** Whole seconds until `at`, updated as they pass. */
const useSecondsLeft = (at?: number) => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!at) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [at]);
  // Until the first tick, `now` may be from long before the countdown.
  const left = Math.min(at ? at - now : 0, COUNTDOWN_MS);
  return Math.max(0, Math.ceil(left / 1000));
};

/** The anime's poster, a placeholder while it loads. */
export const Poster: FC<{ src?: string; className?: string }> = ({
  src,
  className,
}) => (
  <div
    className={cn(
      'bg-muted border-overlay shrink-0 overflow-hidden rounded-sm',
      className,
    )}
  >
    {src && (
      <img src={src} alt="" loading="lazy" className="size-full object-cover" />
    )}
  </div>
);

/** The button that plays it, filling up as the countdown runs out. */
const PlayNow: FC<{ playsAt?: number; size: 'sm' | 'icon-sm' }> = ({
  playsAt,
  size,
}) => {
  const reduceMotion = useReducedMotion();
  // Measured once, so a re-render doesn't restart the fill.
  const [left] = useState(() => (playsAt ? playsAt - Date.now() : 0));

  return (
    <Button
      variant="secondary"
      size={size}
      className={cn(
        'relative isolate overflow-hidden',
        size === 'sm' && 'flex-1 gap-1.5',
      )}
      aria-label={size === 'icon-sm' ? 'Грати зараз' : undefined}
      onClick={upNext.play}
    >
      {playsAt && !reduceMotion && (
        <motion.span
          aria-hidden
          className="bg-foreground/10 absolute inset-0 -z-10 origin-left"
          initial={{ scaleX: 1 - left / COUNTDOWN_MS }}
          animate={{ scaleX: 1 }}
          transition={{ duration: left / 1000, ease: 'linear' }}
        />
      )}
      <MaterialSymbolsSkipNextRounded className="size-5" />
      {size === 'sm' && (playsAt ? 'Грати зараз' : 'Грати')}
    </Button>
  );
};

interface Props {
  /** A single row, for the mini bar; else a card over the video. */
  inline?: boolean;
  /**
   * The card sits in the corner above the controls, clear of the video's
   * own centre button, where the player is big enough; else in the middle.
   */
  corner?: boolean;
}

/**
 * What follows the episode that just ended, playing by itself after a
 * countdown unless the user cancels it. Without autoplay, it waits.
 */
const UpNext: FC<Props> = ({ inline, corner }) => {
  const { status, playsAt } = useUpNext();
  const next = useNextEpisode();
  const { data: anime } = useHikkaContent('anime', next?.slug);
  const seconds = useSecondsLeft(playsAt);
  const shown = status !== 'idle' && !!next;

  // Nothing follows any more, e.g. the queue was cleared meanwhile.
  useEffect(() => {
    if (status !== 'idle' && !next) upNext.cancel();
  }, [status, next]);

  const title = next && (hikkaTitle(anime) ?? next.slug);
  const heading = playsAt ? `Далі через ${seconds} с` : 'Далі';
  const details =
    next && `Епізод ${next.episode}${next.team ? ` · ${next.team}` : ''}`;
  // Said once as it shows; the count itself is only seen.
  const announcement = (
    <p role="status" className="sr-only">
      {shown &&
        `Далі: ${title}, епізод ${next.episode}.${playsAt ? ` Почнеться за ${COUNTDOWN_MS / 1000} секунд.` : ''}`}
    </p>
  );

  if (inline) {
    return (
      <>
        {announcement}
        {shown && (
          <section
            aria-label="Далі"
            className="flex items-center gap-2 px-2 pt-2 text-sm"
          >
            <div className="grid min-w-0 flex-1 leading-tight">
              <span
                aria-hidden
                className="text-muted-foreground text-xs tabular-nums"
              >
                {heading}
              </span>
              <span className="truncate font-medium">
                {title} · Епізод {next.episode}
              </span>
            </div>
            <PlayNow key={playsAt} playsAt={playsAt} size="icon-sm" />
            <Button variant="ghost" size="sm" onClick={upNext.cancel}>
              {playsAt ? 'Скасувати' : 'Закрити'}
            </Button>
          </section>
        )}
      </>
    );
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-30 flex p-4',
        corner
          ? 'items-end justify-end pb-24'
          : 'items-center justify-center pb-12',
      )}
    >
      {announcement}
      <AnimatePresence>
        {shown && (
          <motion.section
            key="up-next"
            // Holding it mustn't speed the video up.
            data-player-controls
            aria-label="Далі"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="player-glass pointer-events-auto flex w-72 max-w-full flex-col gap-1 rounded-lg border p-1 text-sm shadow-lg"
          >
            {/* Smaller in the middle of small players, clear of their controls. */}
            <div
              className={cn(
                'flex items-center',
                corner ? 'gap-3 p-2 pb-1' : 'gap-2 p-1.5 pb-0.5',
              )}
            >
              <Poster
                src={anime?.image}
                className={corner ? 'h-14 w-10' : 'h-10 w-7'}
              />
              <div className="grid min-w-0 flex-1 gap-0.5 leading-tight">
                <span
                  aria-hidden
                  className="text-muted-foreground text-xs tabular-nums"
                >
                  {heading}
                </span>
                <span className="truncate font-medium">{title}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {details}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <PlayNow key={playsAt} playsAt={playsAt} size="sm" />
              <Button variant="ghost" size="sm" onClick={upNext.cancel}>
                {playsAt ? 'Скасувати' : 'Закрити'}
              </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UpNext;
