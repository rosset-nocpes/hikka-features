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

    this.cleanups.toReversed().forEach((cleanup) => cleanup());
    this.cleanups = [];
    this.started = false;
  }

  protected abstract handleCommand(command: IFramePlayerBridgeCommand): void;

  protected onStart() {}

  protected postEvent(event: string, data?: unknown, answer?: unknown) {
    window.parent.postMessage({ event, data, answer }, '*');
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

    this.handleCommand(message);
  };

  private setNudge(factor: number) {
    if (factor === 1) {
      if (!this.nudge) return;
      const { base } = this.nudge;
      this.nudge = undefined;
      // Seen by the player: the speed it knows, back.
      this.video.playbackRate = base;
      return;
    }
    const base = this.nudge?.base ?? this.video.playbackRate;
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
