export default defineContentScript({
  matches: [
    'https://moonanime.art/*',
    'https://ashdi.vip/*',
    'https://tortuga.tw/*',
  ],
  allFrames: true,
  async main(ctx) {
    if (!(await isHikkaContentLoaded())) return;

    const cleanupPlayerUi = () => {
      Array.from(document.querySelectorAll('pjsdiv > pjsdiv'))
        .slice(2)
        .forEach((element) => {
          if (!element.classList.toString().includes('subtitles')) {
            (element as HTMLElement).style.setProperty(
              'display',
              'none',
              'important',
            );
          }
        });
    };

    cleanupPlayerUi();

    const observer = new MutationObserver(cleanupPlayerUi);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    window.setTimeout(() => observer.disconnect(), 10_000);

    const handlePlayerCommand = (message: unknown) => {
      if (!isPlayerCommand(message)) return;

      window.postMessage({ ...message, type: undefined }, '*');
    };

    browser.runtime.onMessage.addListener(handlePlayerCommand);

    ctx.onInvalidated(() => {
      observer.disconnect();
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
