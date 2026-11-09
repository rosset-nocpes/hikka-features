import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot, type Root } from 'react-dom/client';

import {
  COVERED_STYLE,
  coverSiteContent,
  onHikkaNavigation,
} from '@/utils/hikka-router';
import { hikkaTheme } from '@/utils/hikka-theme';

import { HIKKA_PAGE_CHECKERS } from './core.constant';
import { HikkaPages } from './core.enums';
import { queryClient } from './query-client';

/** Renders `node` with what every content script UI needs. */
function renderApp(element: HTMLElement, node: ReactNode) {
  const root = createRoot(element);
  root.render(
    <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>,
  );
  return root;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type FeatureUiOptions = DistributiveOmit<
  ShadowRootContentScriptUiOptions<Root>,
  'onMount' | 'onRemove'
> & {
  render: (container: HTMLElement) => ReactNode;
  /** Declarations for the host, e.g. margins that undo the page's gaps. */
  hostCss?: string;
  /**
   * Takes all of hikka.io's theme colours, not only dark mode, the corners
   * and the accent. On by default.
   */
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
      hikkaTheme.follow(container, { themeVariables });
      onMount?.(container, wrapper, host);
      return renderApp(wrapper, render(container));
    },
    onRemove(root) {
      onRemove?.();
      root?.unmount();
    },
  } as ShadowRootContentScriptUiOptions<Root>);
}

type ModalUiOptions = Pick<
  FeatureUiOptions,
  'name' | 'render' | 'onMount' | 'onRemove'
>;

/**
 * A full-page UI opened on demand, such as the player. It is created on the
 * first open and mounted again on each later one.
 */
export class ModalUi {
  private ui?: ReturnType<typeof createFeatureUi>;

  constructor(private readonly options: ModalUiOptions) {}

  get isOpen(): boolean {
    return !!document.getElementsByTagName(this.options.name)[0];
  }

  open() {
    this.ui ??= createFeatureUi({
      position: 'modal',
      zIndex: 100,
      themeVariables: false,
      ...this.options,
    });
    void this.ui.then((ui) => ui.mount());
  }

  close() {
    void this.ui?.then((ui) => {
      if (ui.mounted || this.isOpen) ui.remove();
    });
  }
}

export abstract class BaseFeature {
  abstract readonly id: string;
  abstract readonly pages: HikkaPages[];
  protected ui: ShadowRootContentScriptUi<Root> | null = null;

  /** Whether `path` is one of the feature's pages. */
  protected matches(path: string) {
    return this.pages.some((page) => HIKKA_PAGE_CHECKERS[page](path));
  }

  get shouldMount(): boolean {
    return this.matches(location.pathname);
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

type OwnPageOptions = DistributiveOmit<FeatureUiOptions, 'name'> & {
  /** Set on `<html>` while the page is open, for `style` to key on. */
  attribute: string;
  /** Rules for the site's route under the page, besides hiding its content. */
  style: string;
};

/**
 * One of the extension's pages, shown over a route of hikka.io's (see
 * `ownPageRoute`) in the site's layout. The route's content stays mounted
 * but hidden (`coverSiteContent`) while the page is open.
 */
export abstract class OwnPageFeature extends BaseFeature {
  protected async createPage({
    attribute,
    style,
    onMount,
    onRemove,
    ...options
  }: OwnPageOptions) {
    const { ctx } = usePageStore.getState();
    const element = document.createElement('style');
    element.textContent = COVERED_STYLE + style;
    document.head.append(element);
    ctx.onInvalidated(() => element.remove());
    ctx.onInvalidated(onHikkaNavigation(this.followNavigation));

    let uncover = () => {};
    this.ui = await createFeatureUi({
      ...options,
      name: this.id,
      onMount: (container, wrapper, host) => {
        document.documentElement.setAttribute(attribute, '');
        uncover = coverSiteContent(host, (path) => this.matches(path));
        onMount?.(container, wrapper, host);
      },
      onRemove: () => {
        document.documentElement.removeAttribute(attribute);
        uncover();
        onRemove?.();
      },
    });
  }

  /**
   * Mounts or unmounts on each of the site's navigations as well: going
   * between the page and the route it is shown over changes nothing in the
   * DOM, which is all the manager watches.
   */
  private followNavigation = () => {
    if (this.shouldMount === this.isMounted) return;
    try {
      if (this.shouldMount) this.mount();
      else this.unmount();
    } catch {
      // Its anchor isn't on the page yet; the manager mounts it once it is.
    }
  };
}

interface AnchoredUi {
  /** Whether the UI's anchor is on the page now. */
  present: () => boolean;
  ui: ContentScriptUi<Root>;
  /** The element the UI puts on the page. */
  element: () => Element;
}

/** A UI rendered right into an element of hikka.io's, for its styles. */
export interface SiteTarget {
  /** The anchor, or undefined while it is not on the page. */
  find: () => HTMLElement | undefined;
  /** Gets the element the UI is in: the anchor, or its parent beside it. */
  render: (parent: HTMLElement) => ReactNode;
  append?: ContentScriptAppendMode;
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

  /** Follows `targets` with UIs laid out as their anchors' own children. */
  protected integrate(targets: SiteTarget[]) {
    const { ctx } = usePageStore.getState();
    this.uis = targets.map(({ find, render, append }) => {
      const ui = createIntegratedUi(ctx, {
        tag: this.id,
        position: 'inline',
        anchor: find,
        append,
        onMount(wrapper) {
          wrapper.style.display = 'contents';
          return renderApp(wrapper, render(wrapper.parentElement!));
        },
        onRemove: (root) => root?.unmount(),
      });
      return { present: () => !!find(), ui, element: () => ui.wrapper };
    });
  }
}
