import { Root } from 'react-dom/client';

import { HIKKA_PAGE_CHECKERS } from './core.constant';
import { HikkaPages } from './core.enums';

export abstract class BaseFeature {
  abstract readonly id: string;
  abstract readonly pages: HikkaPages[];
  protected ui: ShadowRootContentScriptUi<Root> | null = null;

  get shouldMount(): boolean {
    const path = location.pathname;
    return this.pages.some((page) => HIKKA_PAGE_CHECKERS[page]?.(path));
  }

  /** Create UI and React root */
  abstract init(): Promise<void>;

  get isMounted(): boolean {
    return !!this.ui?.mounted;
  }

  mount() {
    if (this.ui) {
      if (this.isMounted) {
        this.unmount();
      }

      this.ui.mount();
    }
  }

  unmount() {
    if (this.isMounted) {
      this.ui?.remove();
    }
  }
}
