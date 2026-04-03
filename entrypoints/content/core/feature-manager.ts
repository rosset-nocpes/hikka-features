import { BaseFeature } from './base-feature';

interface FeatureModule {
  default: new () => BaseFeature;
}

export class FeatureManager {
  private observer: MutationObserver | null = null;
  private features: BaseFeature[] = [];

  constructor() {
    const modules = import.meta.glob<FeatureModule>(
      '/entrypoints/content/features/**/*.feature.tsx',
      { eager: true },
    );

    this.features = Object.values(modules).map((mod) => new mod.default());
  }

  init() {
    usePageStore.getState().updateFromUrl(new URL(location.href));
    for (const f of this.features) f.init();

    // Initial check
    this.reconcile();
    this.startObserving();
  }

  async reconcile() {
    const mountOperations = this.features.map(async (feature) => {
      const shouldBeVisible = feature.shouldMount;
      const currentlyVisible = feature.isMounted;

      // when opening a new page, it may remove features from dom, so unmount if needed
      if (
        shouldBeVisible &&
        currentlyVisible &&
        document.body.querySelectorAll(feature.id).length === 0
      ) {
        feature.unmount();
      }

      if (shouldBeVisible && !currentlyVisible) {
        feature.mount();
      } else if (!shouldBeVisible && currentlyVisible) {
        feature.unmount();
      }
    });

    const results = await Promise.allSettled(mountOperations);

    // results.forEach((result, index) => {
    //   if (result.status === 'rejected') {
    //     console.error(
    //       `Failed to mount/unmount feature ${this.features[index].id}:`,
    //       result.reason,
    //     );
    //   }
    // });
  }

  /**
   * Self-healing: Watch the DOM. If features are deleted, re-mount them.
   */
  private startObserving() {
    this.observer = new MutationObserver(() => {
      usePageStore.getState().updateFromUrl(new URL(location.href));
      this.reconcile();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  stop() {
    this.observer?.disconnect();
    this.features.forEach((f) => f.unmount());
  }
}
