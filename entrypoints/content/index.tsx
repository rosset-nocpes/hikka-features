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
    usePageStore.getState().setCTX(ctx);

    const manager = new FeatureManager();
    manager.init();

    ctx.onInvalidated(() => {
      manager.stop();
    });
  },
});
