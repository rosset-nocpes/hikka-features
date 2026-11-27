import type { IFramePlayerBridgeCommand } from './protocol';

import { IFramePlayerBridge } from './bridge';

interface PlayerJsCommand {
  api: string;
  set?: number | string;
}

export class PlayerJsBridge extends IFramePlayerBridge {
  static readonly styles = `
    pjsdiv
      > pjsdiv:not(:has(video)):not(:has(video) + pjsdiv):not([id*='subtitle']):not([class*='subtitle']) {
      display: none !important;
    }
  `;

  static detect(video: HTMLVideoElement) {
    return video.closest('pjsdiv') !== null;
  }

  protected handleCommand(command: IFramePlayerBridgeCommand) {
    window.postMessage(this.toPlayerJsCommand(command), '*');
    if (command.action === 'play') this.checkAutoplay();
  }

  /**
   * PlayerJS keeps a refused play to itself, so the browser is asked with a
   * video of the bridge's own: one without a source is refused at once
   * where the page's would be, and plays nothing otherwise. Muted like the
   * page's, as browsers let muted videos play.
   */
  private checkAutoplay() {
    const probe = document.createElement('video');
    probe.muted = this.video.muted || this.video.volume === 0;
    probe.play().catch((error) => this.reportBlockedPlay(error));
  }

  private toPlayerJsCommand(
    command: IFramePlayerBridgeCommand,
  ): PlayerJsCommand {
    switch (command.action) {
      case 'play':
      case 'pause':
      case 'mute':
      case 'unmute':
        return { api: command.action };
      case 'seek':
        return { api: 'seek', set: command.value };
      case 'set-volume':
        return { api: 'volume', set: command.value };
      case 'get-volume':
        return { api: 'volume' };
      case 'set-speed':
        return { api: 'speed', set: String(command.index) };
      case 'set-quality':
        return { api: 'quality', set: String(command.index) };
      case 'get-quality':
        return { api: 'quality' };
      case 'get-qualities':
        return { api: 'qualities' };
      case 'set-subtitle':
        return { api: 'subtitle', set: String(command.index) };
      case 'get-subtitles':
        return { api: 'subtitles' };
      case 'get-buffered':
        return { api: 'buffered' };
    }
  }
}
