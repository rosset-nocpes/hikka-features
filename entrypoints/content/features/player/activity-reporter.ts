import type { FunctionArgs } from 'convex/server';

import { useIFramePlayer } from '@/hooks/use-iframe-player';
import { account } from '@/utils/account';
import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';

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
class ActivityReporter {
  private running = false;
  private shared?: boolean;
  private reported = false;
  private lastKey?: string;
  private scheduledKey?: string;
  private delay?: ReturnType<typeof setTimeout>;
  private interval?: ReturnType<typeof setInterval>;
  private unsubscribers: (() => void)[] = [];

  start() {
    if (this.running) return;
    this.running = true;
    this.shared = undefined;
    this.lastKey = undefined;

    this.interval = setInterval(this.send, REPORT_INTERVAL_MS);
    this.unsubscribers = [
      usePlayer.subscribe(this.schedule),
      useIFramePlayer.subscribe(this.schedule),
      useWatchTogether.subscribe(this.schedule),
    ];
    // Leaving the page; a page restored from the back/forward cache reports
    // again on the next tick.
    window.addEventListener('pagehide', this.clear);
    this.schedule();
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    clearTimeout(this.delay);
    this.scheduledKey = undefined;
    clearInterval(this.interval);
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    window.removeEventListener('pagehide', this.clear);
    this.clear();
  }

  private send = async () => {
    const report = currentReport();
    if (!this.running || !report || !account.signedIn) return;
    try {
      if (!this.shared) {
        ({ shareActivity: this.shared } = await convex.accountQuery(
          convexApi.activity.settings,
          {},
        ));
        if (!this.shared || !this.running) return;
      }
      this.lastKey = JSON.stringify(report);
      ({ shared: this.shared } = await convex.accountMutation(
        convexApi.activity.report,
        report,
      ));
      this.reported ||= this.shared;
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * The player's time updates call this several times a second; only a new
   * report restarts the delay.
   */
  private schedule = () => {
    const report = currentReport();
    const key = report && JSON.stringify(report);
    if (!key || key === this.lastKey || key === this.scheduledKey) return;
    this.scheduledKey = key;
    clearTimeout(this.delay);
    this.delay = setTimeout(() => {
      this.scheduledKey = undefined;
      void this.send();
    }, REPORT_DELAY_MS);
  };

  private clear = () => {
    if (!this.reported || !account.signedIn) return;
    this.reported = false;
    this.lastKey = undefined;
    convex.accountMutation(convexApi.activity.clear, {}).catch(console.error);
  };
}

export const activityReporter = new ActivityReporter();
