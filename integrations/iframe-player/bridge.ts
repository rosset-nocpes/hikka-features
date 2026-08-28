import {
  isIFramePlayerCommand,
  type IFramePlayerBridgeCommand,
} from './protocol';

export interface IFramePlayerBridgeClass {
  new (video: HTMLVideoElement): IFramePlayerBridge;
  readonly matches: readonly string[];
  readonly styles: string;
  supports(url: URL): boolean;
}

export abstract class IFramePlayerBridge {
  private cleanups: (() => void)[] = [];
  private started = false;

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

  private addCleanup(cleanup: () => void) {
    this.cleanups.push(cleanup);
  }

  private handleRuntimeMessage = (message: unknown) => {
    if (!isIFramePlayerCommand(message)) return;

    if (message.action === 'toggle-picture-in-picture') {
      this.togglePictureInPicture();
      return;
    }

    this.handleCommand(message);
  };

  private togglePictureInPicture() {
    if (document.pictureInPictureElement === this.video) {
      document.exitPictureInPicture?.().catch(() => {});
      return;
    }

    this.video.requestPictureInPicture?.().catch(() => {});
  }
}
