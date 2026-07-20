import { usePlayer } from './content/features/player/context/player-context';

// todo: add own ui for ad
// todo: add own ui for subtitle system
const HIDE_PLAYER_UI_CSS = `
  pjsdiv
    > pjsdiv:not(:has(video)):not(:has(video) + pjsdiv):not([id*='subtitle']):not([class*='subtitle']) {
    display: none !important;
  }
`;

const VIDEO_WAIT_TIMEOUT_MS = 15_000;

export default defineContentScript({
  matches: [
    'https://moonanime.art/*',
    'https://ashdi.vip/*',
    'https://tortuga.tw/*',
  ],
  allFrames: true,
  runAt: 'document_start',
  async main(ctx) {
    const fromHikka = ['https://hikka.io/', 'https://dev.hikka.io/'].some(
      (origin) => document.referrer.startsWith(origin),
    );

    if (!fromHikka && !(await isHikkaContentLoaded())) return;

    const style = document.createElement('style');
    style.textContent = HIDE_PLAYER_UI_CSS;
    (document.head ?? document.documentElement)?.appendChild(style);
    ctx.onInvalidated(() => style.remove());

    let video: HTMLVideoElement | null = document.querySelector('video');

    if (!video) {
      video = await new Promise<HTMLVideoElement | null>((resolve) => {
        const observer = new MutationObserver(() => {
          const el = document.querySelector('video');
          if (el) finish(el as HTMLVideoElement);
        });

        const timeout = window.setTimeout(
          () => finish(null),
          VIDEO_WAIT_TIMEOUT_MS,
        );

        const finish = (result: HTMLVideoElement | null) => {
          window.clearTimeout(timeout);
          observer.disconnect();
          resolve(result);
        };

        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
        ctx.onInvalidated(() => finish(null));
      });
    }

    if (!video) {
      style.remove();
      return;
    }

    const handlePlayerCommand = (message: unknown) => {
      if (!isPlayerCommand(message)) return;

      if (message.api === 'piptoggle') {
        if (usePlayer.getState().videoPiPActive) {
          document.exitPictureInPicture().catch(() => {});
        } else {
          video.requestPictureInPicture().catch(() => {});
        }
      }

      const { type: _type, ...command } = message;
      window.postMessage(command, '*');
    };

    const handlePIPEnter = () => {
      window.parent.postMessage({ event: 'pip', data: true }, '*');
      usePlayer.getState().setVideoPiPActive(true);
    };

    const handlePIPLeave = () => {
      window.parent.postMessage({ event: 'pip', data: false }, '*');
      usePlayer.getState().setVideoPiPActive(false);
    };

    video.addEventListener('enterpictureinpicture', handlePIPEnter);
    video.addEventListener('leavepictureinpicture', handlePIPLeave);

    browser.runtime.onMessage.addListener(handlePlayerCommand);

    ctx.onInvalidated(() => {
      video.removeEventListener('enterpictureinpicture', handlePIPEnter);
      video.removeEventListener('leavepictureinpicture', handlePIPLeave);
      browser.runtime.onMessage.removeListener(handlePlayerCommand);
    });
  },
});

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

const isPlayerCommand = (
  message: unknown,
): message is { type: 'playerjs-command'; api: string } =>
  !!message &&
  typeof message === 'object' &&
  'type' in message &&
  message.type === 'playerjs-command' &&
  'api' in message &&
  typeof message.api === 'string';
