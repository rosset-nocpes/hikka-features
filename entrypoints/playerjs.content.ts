export default defineContentScript({
  matches: [
    'https://moonanime.art/*',
    'https://ashdi.vip/*',
    'https://tortuga.tw/*',
  ],
  allFrames: true,
  main() {
    if (document.referrer === 'https://hikka.io/') {
      Array.from(document.querySelectorAll('pjsdiv > pjsdiv'))
        .slice(2)
        .forEach(
          (e) => !e.classList.toString().includes('subtitles') && e.remove(),
        );

      const newScript = document.createElement('script');
      newScript.src = browser.runtime.getURL('/playerjs-script.js');
      document.head.appendChild(newScript);

      window.top?.postMessage({ type: 'playerjs-event', event: 'init' }, '*');

      browser.runtime.onMessage.addListener((message) => {
        if (message.type === 'playerjs-command') {
          window.postMessage(
            {
              type: 'playerjs-command',
              api: message.api,
              param: message.param,
            },
            '*',
          );
        }
      });
    }
  },
});
