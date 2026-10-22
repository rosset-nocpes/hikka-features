import type { BaseFeature } from './base-feature';

interface FeatureModule {
  default: new () => BaseFeature;
}

export class FeatureManager {
  private observer: MutationObserver | null = null;
  private features: BaseFeature[] = [];
  private frame = 0;
  private stopped = false;

  constructor() {
    const modules = import.meta.glob<FeatureModule>(
      '/entrypoints/content/features/**/*.feature.tsx',
      { eager: true },
    );

    this.features = Object.values(modules).map((mod) => new mod.default());
  }

  init() {
    // UIs load their styles first; place them as soon as they're ready.
    void Promise.all(this.features.map((feature) => feature.init())).then(
      this.schedule,
    );
    this.reconcile();
    this.startObserving();
  }

  /** Mounts the features the page wants and unmounts the rest. */
  reconcile() {
    usePageStore.getState().updateFromUrl(new URL(location.href));

    for (const feature of this.features) {
      try {
        if (!feature.shouldMount) {
          if (feature.isMounted) feature.unmount();
        } else if (
          !feature.isMounted ||
          // Opening another page may take the feature off it.
          !document.body.querySelector(feature.id)
        ) {
          feature.mount();
        }
      } catch {
        // Its anchor isn't on the page yet; the next change tries again.
      }
    }
  }

  /** Once a frame at most: the page changes a lot while it renders. */
  private schedule = () => {
    if (this.stopped) return;
    this.frame ||= requestAnimationFrame(() => {
      this.frame = 0;
      this.reconcile();
    });
  };

  /** Self-healing: features the page removes are mounted again. */
  private startObserving() {
    this.observer = new MutationObserver(this.schedule);
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  stop() {
    this.stopped = true;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.observer?.disconnect();
    this.features.forEach((feature) => feature.unmount());
  }
}
