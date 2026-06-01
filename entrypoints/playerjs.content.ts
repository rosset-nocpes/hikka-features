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
            element.remove();
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

    if (!document.getElementById('hikka-features-playerjs-script')) {
      const newScript = document.createElement('script');
      newScript.id = 'hikka-features-playerjs-script';
      newScript.src = browser.runtime.getURL('/playerjs-script.js');
      (document.head ?? document.documentElement).appendChild(newScript);
    }

    window.top?.postMessage({ type: 'playerjs-event', event: 'init' }, '*');

    const handlePlayerCommand = (message: unknown) => {
      if (!isPlayerCommand(message)) return;

      window.postMessage(
        {
          type: 'playerjs-command',
          api: message.api,
          param: message.param,
        },
        '*',
      );
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

  return false;
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
): message is { type: 'playerjs-command'; api: string; param?: unknown } =>
  !!message &&
  typeof message === 'object' &&
  'type' in message &&
  message.type === 'playerjs-command' &&
  'api' in message &&
  typeof message.api === 'string';
