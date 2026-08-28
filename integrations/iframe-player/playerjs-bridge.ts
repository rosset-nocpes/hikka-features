import type { IFramePlayerBridgeCommand } from './protocol';

import { IFramePlayerBridge } from './bridge';

const PLAYER_JS_HOSTS = ['ashdi.vip', 'tortuga.tw'];

interface PlayerJsCommand {
  api: string;
  set?: number | string;
}

export class PlayerJsBridge extends IFramePlayerBridge {
  static readonly matches = PLAYER_JS_HOSTS.map((host) => `https://${host}/*`);

  static readonly styles = `
    pjsdiv
      > pjsdiv:not(:has(video)):not(:has(video) + pjsdiv):not([id*='subtitle']):not([class*='subtitle']) {
      display: none !important;
    }
  `;

  static supports(url: URL) {
    return PLAYER_JS_HOSTS.includes(url.hostname);
  }

  protected handleCommand(command: IFramePlayerBridgeCommand) {
    window.postMessage(this.toPlayerJsCommand(command), '*');
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
