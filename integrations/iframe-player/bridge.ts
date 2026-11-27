import {
  isIFramePlayerCommand,
  type IFramePlayerBridgeCommand,
} from './protocol';

export interface IFramePlayerBridgeClass {
  new (video: HTMLVideoElement): IFramePlayerBridge;
  readonly styles: string;
  detect(video: HTMLVideoElement): boolean;
}

export abstract class IFramePlayerBridge {
  private cleanups: (() => void)[] = [];
  private started = false;
  /** The speed chosen, and the one played at while nudged off it. */
  private nudge?: { base: number; rate: number };

  constructor(protected readonly video: HTMLVideoElement) {}

  start() {
    if (this.started) return;
    this.started = true;

    browser.runtime.onMessage.addListener(this.handleRuntimeMessage);
    this.addCleanup(() => {
      browser.runtime.onMessage.removeListener(this.handleRuntimeMessage);
    });

    this.listen(this.video, 'enterpictureinpicture', () => {
      this.postEvent('pip', true);
    });
    this.listen(this.video, 'leavepictureinpicture', () => {
      this.postEvent('pip', false);
    });
    this.handleNextTrack();
    // Nudged speeds stay between the bridge and the video: the player would
    // show them, and may save them as the user's choice. At the window, in
    // capture, this runs before any listener on the video.
    this.listen(
      window,
      'ratechange',
      (event) => {
        if (!this.nudge || event.target !== this.video) return;
        if (Math.abs(this.video.playbackRate - this.nudge.rate) < 1e-3) {
          event.stopImmediatePropagation();
        } else {
          // Changed by someone else, e.g. the speed picked: no longer nudged.
          this.nudge = undefined;
        }
      },
      { capture: true },
    );

    this.onStart();
  }

  destroy() {
    if (!this.started) return;
    // E.g. the extension updated mid-nudge: the video plays at its speed again.
    this.setNudge(1);

    this.cleanups.toReversed().forEach((cleanup) => cleanup());
    this.cleanups = [];
    this.started = false;
  }

  protected abstract handleCommand(command: IFramePlayerBridgeCommand): void;

  protected onStart() {}

  protected postEvent(event: string, data?: unknown, answer?: unknown) {
    window.parent.postMessage({ event, data, answer }, '*');
  }

  /**
   * Tells the page when the browser refused to play, as it does with sound
   * until the page is used, e.g. after joining a room from an invite.
   */
  protected reportBlockedPlay(error: unknown) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      this.postEvent('play-blocked');
    }
  }

  protected listen(
    target: EventTarget,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ) {
    target.addEventListener(event, listener, options);
    this.addCleanup(() => target.removeEventListener(event, listener, options));
  }

  /**
   * Media keys and the picture-in-picture window's next button skip to the
   * episode that follows, which the page's player picks.
   */
  private handleNextTrack() {
    const session = navigator.mediaSession;
    if (!session) return;
    try {
      session.setActionHandler('nexttrack', () => this.postEvent('nexttrack'));
      this.addCleanup(() => session.setActionHandler('nexttrack', null));
    } catch {
      // A browser without the action.
    }
  }

  private addCleanup(cleanup: () => void) {
    this.cleanups.push(cleanup);
  }

  private handleRuntimeMessage = (message: unknown) => {
    if (!isIFramePlayerCommand(message)) return;

    if (message.action === 'toggle-picture-in-picture') {
      this.togglePictureInPicture();
      return;
    }
    if (message.action === 'nudge') {
      this.setNudge(message.value);
      return;
    }
    // A speed or quality picked replaces the nudge: the player sets it from
    // the speed it knows, and may not touch the video if that is unchanged.
    if (message.action === 'set-speed' || message.action === 'set-quality') {
      this.setNudge(1);
    }

    this.handleCommand(message);
  };

  private setNudge(factor: number) {
    // A speed set since, whose event hasn't come yet, replaces the nudge.
    const nudged =
      this.nudge && Math.abs(this.video.playbackRate - this.nudge.rate) < 1e-3;
    if (factor === 1) {
      const base = nudged ? this.nudge!.base : undefined;
      this.nudge = undefined;
      // Seen by the player: the speed it knows, back.
      if (base !== undefined) this.video.playbackRate = base;
      return;
    }
    const base = nudged ? this.nudge!.base : this.video.playbackRate;
    const rate = Math.round(base * factor * 1000) / 1000;
    this.nudge = { base, rate };
    this.video.playbackRate = rate;
  }

  private togglePictureInPicture() {
    if (document.pictureInPictureElement === this.video) {
      document.exitPictureInPicture?.().catch(() => {});
      return;
    }

    this.video.requestPictureInPicture?.().catch(() => {});
  }
}
