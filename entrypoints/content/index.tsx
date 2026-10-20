import '../app.css';
import { sendToBackground } from '@/utils/messaging';

import { FeatureManager } from './core/feature-manager';

export default defineContentScript({
  matches: ['https://hikka.io/*', 'https://dev.hikka.io/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    void sendToBackground('hikka-content-loaded').catch(() => undefined);

    usePageStore.getState().setCTX(ctx);

    const manager = new FeatureManager();
    manager.init();

    ctx.onInvalidated(() => {
      void sendToBackground('hikka-content-unloaded').catch(() => undefined);
      manager.stop();
    });
  },
});
