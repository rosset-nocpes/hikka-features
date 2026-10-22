import '../app.css';
import { hikkaViewerQuery } from '@/utils/hikka-viewer';
import { sendToBackground } from '@/utils/messaging';

import { FeatureManager } from './core/feature-manager';
import { queryClient } from './core/query-client';

/** Tells the background who hikka.io is signed in as; it follows the site. */
const followHikkaSession = () =>
  queryClient
    .fetchQuery({ ...hikkaViewerQuery, staleTime: 0 })
    .then((viewerId) => sendToBackground('hikka-viewer', { viewerId }))
    .catch(() => undefined);

export default defineContentScript({
  matches: ['https://hikka.io/*', 'https://dev.hikka.io/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    void sendToBackground('hikka-content-loaded').catch(() => undefined);

    // Hikka's logout reloads the page; another tab may have switched user.
    void followHikkaSession();
    ctx.addEventListener(document, 'visibilitychange', () => {
      if (document.visibilityState === 'visible') void followHikkaSession();
    });

    usePageStore.getState().setCTX(ctx);

    const manager = new FeatureManager();
    manager.init();

    ctx.onInvalidated(() => {
      void sendToBackground('hikka-content-unloaded').catch(() => undefined);
      manager.stop();
    });
  },
});
