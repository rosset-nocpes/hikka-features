import {
  findIFramePlayerBridge,
  IFRAME_PLAYER_MATCHES,
} from '@/integrations/iframe-player/registry';

const VIDEO_WAIT_TIMEOUT_MS = 15_000;

export default defineContentScript({
  matches: IFRAME_PLAYER_MATCHES,
  allFrames: true,
  runAt: 'document_start',
  async main(ctx) {
    const Bridge = findIFramePlayerBridge(new URL(window.location.href));
    if (!Bridge) return;

    const fromHikka = ['https://hikka.io/', 'https://dev.hikka.io/'].some(
      (origin) => document.referrer.startsWith(origin),
    );

    if (!fromHikka && !(await isHikkaContentLoaded())) return;

    const style = document.createElement('style');
    style.textContent = Bridge.styles;
    (document.head ?? document.documentElement).appendChild(style);
    ctx.onInvalidated(() => style.remove());

    const video = await findVideo(ctx);
    if (!video) {
      style.remove();
      return;
    }

    const bridge = new Bridge(video);
    bridge.start();
    ctx.onInvalidated(() => bridge.destroy());
  },
});

const findVideo = async (ctx: {
  onInvalidated: (callback: () => void) => void;
}) => {
  const existingVideo = document.querySelector<HTMLVideoElement>('video');
  if (existingVideo) return existingVideo;

  return new Promise<HTMLVideoElement | null>((resolve) => {
    const observer = new MutationObserver(() => {
      const video = document.querySelector<HTMLVideoElement>('video');
      if (video) finish(video);
    });

    const timeout = window.setTimeout(
      () => finish(null),
      VIDEO_WAIT_TIMEOUT_MS,
    );

    const finish = (video: HTMLVideoElement | null) => {
      window.clearTimeout(timeout);
      observer.disconnect();
      resolve(video);
    };

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    ctx.onInvalidated(() => finish(null));
  });
};

const isHikkaContentLoaded = async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await browser.runtime
      .sendMessage({ type: 'hikka-content-status' })
      .catch(() => undefined);

    if (isHikkaContentStatusResponse(response) && response.loaded) return true;

    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }

  // todo: return false
  return document.referrer === 'https://hikka.io/';
};

const isHikkaContentStatusResponse = (
  response: unknown,
): response is { loaded: boolean } =>
  !!response &&
  typeof response === 'object' &&
  'loaded' in response &&
  typeof response.loaded === 'boolean';
