import type { IFramePlayerBridgeClass } from '@/integrations/iframe-player/bridge';

import {
  findIFramePlayerBridge,
  IFRAME_PLAYER_MATCHES,
} from '@/integrations/iframe-player/registry';

const PLAYER_DETECTION_TIMEOUT_MS = 15_000;

export default defineContentScript({
  matches: IFRAME_PLAYER_MATCHES,
  allFrames: true,
  runAt: 'document_start',
  async main(ctx) {
    if (window.parent === window) return;

    const fromHikka = ['https://hikka.io/', 'https://dev.hikka.io/'].some(
      (origin) => document.referrer.startsWith(origin),
    );

    if (!fromHikka && !(await isHikkaContentLoaded())) return;

    const player = await findPlayer(ctx);
    if (!player) return;

    const { Bridge, video } = player;

    const style = document.createElement('style');
    style.textContent = Bridge.styles;
    (document.head ?? document.documentElement).appendChild(style);
    ctx.onInvalidated(() => style.remove());

    const bridge = new Bridge(video);
    bridge.start();
    ctx.onInvalidated(() => bridge.destroy());
  },
});

interface DetectedPlayer {
  Bridge: IFramePlayerBridgeClass;
  video: HTMLVideoElement;
}

const detectPlayer = (): DetectedPlayer | null => {
  for (const video of document.querySelectorAll<HTMLVideoElement>('video')) {
    const Bridge = findIFramePlayerBridge(video);
    if (Bridge) return { Bridge, video };
  }

  return null;
};

const findPlayer = async (ctx: {
  onInvalidated: (callback: () => void) => void;
}) => {
  const existingPlayer = detectPlayer();
  if (existingPlayer) return existingPlayer;

  return new Promise<DetectedPlayer | null>((resolve) => {
    const observer = new MutationObserver(() => {
      const player = detectPlayer();
      if (player) finish(player);
    });

    const timeout = window.setTimeout(
      () => finish(null),
      PLAYER_DETECTION_TIMEOUT_MS,
    );

    const finish = (player: DetectedPlayer | null) => {
      window.clearTimeout(timeout);
      observer.disconnect();
      resolve(player);
    };

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });
    ctx.onInvalidated(() => finish(null));
  });
};

const isHikkaContentLoaded = async () => {
  const response = await browser.runtime
    .sendMessage({ type: 'hikka-content-status' })
    .catch(() => undefined);

  return isHikkaContentStatusResponse(response) && response.loaded;
};

const isHikkaContentStatusResponse = (
  response: unknown,
): response is { loaded: boolean } =>
  !!response &&
  typeof response === 'object' &&
  'loaded' in response &&
  typeof response.loaded === 'boolean';
