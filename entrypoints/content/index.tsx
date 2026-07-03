import { QueryClient } from '@tanstack/react-query';

import '../app.css';
import { FeatureManager } from './core/feature-manager';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

export default defineContentScript({
  matches: ['https://hikka.io/*', 'https://dev.hikka.io/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    void browser.runtime
      .sendMessage({ type: 'hikka-content-loaded' })
      .catch(() => undefined);

    usePageStore.getState().setCTX(ctx);

    const manager = new FeatureManager();
    manager.init();

    ctx.onInvalidated(() => {
      void browser.runtime
        .sendMessage({ type: 'hikka-content-unloaded' })
        .catch(() => undefined);
      manager.stop();
    });
  },
});
