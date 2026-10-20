import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot, type Root } from 'react-dom/client';

import { syncFeatureTheme } from '@/utils/utils';

import { HIKKA_PAGE_CHECKERS } from './core.constant';
import { HikkaPages } from './core.enums';
import { queryClient } from './query-client';

/** Renders `node` with what every content script UI needs. */
export function renderApp(element: HTMLElement, node: ReactNode) {
  const root = createRoot(element);
  root.render(
    <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>,
  );
  return root;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type FeatureUiOptions = DistributiveOmit<
  ShadowRootContentScriptUiOptions<Root>,
  'onMount' | 'onRemove'
> & {
  render: (container: HTMLElement) => ReactNode;
  /** Declarations for the host, e.g. margins that undo the page's gaps. */
  hostCss?: string;
  /** Takes hikka.io's theme colours, not only dark mode. On by default. */
  themeVariables?: boolean;
  /** Runs before the first render, e.g. to size the container. */
  onMount?: (
    container: HTMLElement,
    wrapper: HTMLDivElement,
    host: HTMLElement,
  ) => void;
  onRemove?: () => void;
};

/** A shadow root UI that renders a React app themed like hikka.io. */
export function createFeatureUi({
  render,
  hostCss,
  themeVariables = true,
  onMount,
  onRemove,
  ...options
}: FeatureUiOptions) {
  return createShadowRootUi(usePageStore.getState().ctx, {
    inheritStyles: true,
    css: hostCss && `:host(${options.name}) { ${hostCss} }`,
    ...options,
    onMount(container, _shadow, host) {
      const wrapper = document.createElement('div');
      container.append(wrapper);
      syncFeatureTheme(container, { themeVariables });
      onMount?.(container, wrapper, host);
      return renderApp(wrapper, render(container));
    },
    onRemove(root) {
      onRemove?.();
      root?.unmount();
    },
  } as ShadowRootContentScriptUiOptions<Root>);
}

export abstract class BaseFeature {
  abstract readonly id: string;
  abstract readonly pages: HikkaPages[];
  protected ui: ShadowRootContentScriptUi<Root> | null = null;

  get shouldMount(): boolean {
    const path = location.pathname;
    return this.pages.some((page) => HIKKA_PAGE_CHECKERS[page]?.(path));
  }

  /** Creates the UI; the manager mounts it once the page fits. */
  abstract init(): Promise<void>;

  get isMounted(): boolean {
    return !!this.ui?.mounted;
  }

  mount() {
    if (!this.ui) return;
    if (this.isMounted) this.unmount();
    this.ui.mount();
  }

  unmount() {
    if (this.isMounted) this.ui?.remove();
  }
}

interface AnchoredUi {
  /** Whether the UI's anchor is on the page now. */
  present: () => boolean;
  ui: ContentScriptUi<Root>;
  /** The element the UI puts on the page. */
  element: () => Element;
}

/**
 * Several UIs that each follow their own anchor, mounted whenever it is on
 * the page, e.g. inside a menu that only exists while open.
 */
export abstract class AnchoredUisFeature extends BaseFeature {
  protected uis: AnchoredUi[] = [];

  override get isMounted(): boolean {
    const present = this.uis.filter((entry) => entry.present());
    return (
      present.length > 0 &&
      present.every(({ ui, element }) => ui.mounted && element().isConnected)
    );
  }

  override mount() {
    for (const { present, ui, element } of this.uis) {
      if (!present() || (ui.mounted && element().isConnected)) continue;
      // The page removed the anchor along with the UI; start over in the new one.
      if (ui.mounted) ui.remove();
      ui.mount();
    }
  }

  override unmount() {
    for (const { ui } of this.uis) {
      if (ui.mounted) ui.remove();
    }
  }
}
