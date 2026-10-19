import type { FunctionArgs } from 'convex/server';

import { useIFramePlayer } from '@/hooks/use-iframe-player';
import { useSettings } from '@/hooks/use-settings';
import { convexApi } from '@/utils/convex-api';
import { accountMutation, accountQuery } from '@/utils/convex-client';

import { usePlayer } from './context/player-context';
import { useWatchTogether } from './watch-together/use-watch-together';

/** The server forgets activity three minutes after the last report. */
const REPORT_INTERVAL_MS = 60_000;
/** Lets a burst of changes, like switching episodes, settle into one report. */
const REPORT_DELAY_MS = 1_500;

type Report = FunctionArgs<typeof convexApi.activity.report>;

const currentReport = (): Report | undefined => {
  const { slug, currentEpisode } = usePlayer.getState();
  if (!slug || !currentEpisode) return undefined;
  const roomCode = useWatchTogether.getState().room?.code;
  return {
    animeSlug: slug,
    episode: currentEpisode.episode,
    playing: useIFramePlayer.getState().isPlaying,
    ...(roomCode && { roomCode }),
  };
};

/**
 * Tells the user's friends what the open player shows. Nothing is sent while
 * the user doesn't share their activity; that is checked again every minute.
 */
export function startActivityReporter() {
  let shared: boolean | undefined;
  let reported = false;
  let stopped = false;
  let lastKey: string | undefined;
  let delay: ReturnType<typeof setTimeout> | undefined;

  const send = async () => {
    const report = currentReport();
    if (stopped || !report || !useSettings.getState().convexSession) return;
    try {
      if (!shared) {
        ({ shareActivity: shared } = await accountQuery(
          convexApi.activity.settings,
          {},
        ));
        if (!shared || stopped) return;
      }
      lastKey = JSON.stringify(report);
      ({ shared } = await accountMutation(convexApi.activity.report, report));
      reported ||= shared;
    } catch (error) {
      console.error(error);
    }
  };

  // The player's time updates call this several times a second; only a new
  // report restarts the delay.
  let scheduledKey: string | undefined;
  const schedule = () => {
    const report = currentReport();
    const key = report && JSON.stringify(report);
    if (!key || key === lastKey || key === scheduledKey) return;
    scheduledKey = key;
    clearTimeout(delay);
    delay = setTimeout(() => {
      scheduledKey = undefined;
      void send();
    }, REPORT_DELAY_MS);
  };

  const clear = () => {
    if (!reported || !useSettings.getState().convexSession) return;
    reported = false;
    lastKey = undefined;
    accountMutation(convexApi.activity.clear, {}).catch(console.error);
  };

  const interval = setInterval(send, REPORT_INTERVAL_MS);
  const unsubscribers = [
    usePlayer.subscribe(schedule),
    useIFramePlayer.subscribe(schedule),
    useWatchTogether.subscribe(schedule),
  ];
  // Leaving the page; a page restored from the back/forward cache reports
  // again on the next tick.
  window.addEventListener('pagehide', clear);
  schedule();

  return () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(delay);
    clearInterval(interval);
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    window.removeEventListener('pagehide', clear);
    clear();
  };
}
