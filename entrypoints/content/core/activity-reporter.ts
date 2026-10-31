import { account } from '@/utils/account';
import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';

/** The server forgets activity three minutes after the last report. */
const REPORT_INTERVAL_MS = 60_000;
/** Lets a burst of changes, like switching episodes, settle into one report. */
const REPORT_DELAY_MS = 1_500;

export interface ActivitySource<Report> {
  /** What the open player or reader shows; undefined while it has nothing. */
  current: () => Report | undefined;
  /** Calls `listener` whenever `current` may have changed. */
  subscribe: (listener: () => void) => (() => void)[];
  /** Sends it; `shared` is false while the user doesn't share activity. */
  report: (report: Report) => Promise<{ shared: boolean }>;
  clear: () => Promise<unknown>;
}

/**
 * Tells the user's friends what an open player or reader shows. Nothing is
 * sent while the user doesn't share their activity; that is checked again
 * every minute.
 */
export class ActivityReporter<Report> {
  private readonly source: ActivitySource<Report>;
  private running = false;
  private shared?: boolean;
  private reported = false;
  private lastKey?: string;
  private scheduledKey?: string;
  private delay?: ReturnType<typeof setTimeout>;
  private interval?: ReturnType<typeof setInterval>;
  private unsubscribers: (() => void)[] = [];

  constructor(source: ActivitySource<Report>) {
    this.source = source;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.shared = undefined;
    this.lastKey = undefined;

    this.interval = setInterval(this.send, REPORT_INTERVAL_MS);
    this.unsubscribers = this.source.subscribe(this.schedule);
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
    const report = this.source.current();
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
      ({ shared: this.shared } = await this.source.report(report));
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
    const report = this.source.current();
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
    this.source.clear().catch(console.error);
  };
}
