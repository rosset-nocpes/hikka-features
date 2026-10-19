import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import { useSettings } from '@/hooks/use-settings';

import { queryClient } from '../..';
import { BaseFeature } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import FriendsActivityBlock from './friends-activity-block';
import { HomePlacement, useBlockView } from './home-placement';
import { LayoutDialog } from './layout-dialog';
import { syncUserTheme } from './user-theme';

/**
 * Follows the homepage as hikka.io re-renders it, resizes between layouts
 * and opens its layout dialog, keeping the block and its row where the user
 * put them.
 */
class Layout {
  private readonly home: HomePlacement;
  private readonly dialog = new LayoutDialog();
  private readonly observer = new MutationObserver(() => this.schedule());
  private readonly unsubscribers: (() => void)[];
  private frame = 0;

  constructor(host: HTMLElement) {
    this.home = new HomePlacement(host);
    this.observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', this.schedule);
    this.unsubscribers = [
      useSettings.subscribe((state, previous) => {
        if (
          state.features.friendsActivity !== previous.features.friendsActivity
        ) {
          this.update();
        }
      }),
      useBlockView.subscribe(() => this.update()),
    ];
    this.update();
  }

  /** Once a frame at most: the page changes a lot while it loads. */
  private schedule = () => {
    this.frame ||= requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  };

  private update() {
    this.home.update();
    this.dialog.update();
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    window.removeEventListener('resize', this.schedule);
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.home.stop();
    this.dialog.stop();
  }
}

/**
 * "Friends are watching": a homepage widget among hikka.io's own, which the
 * user moves, hides and brings back in the site's layout dialog.
 */
export default class FriendsActivityFeature extends BaseFeature {
  readonly id = 'friends-activity';
  readonly pages = [HikkaPages.Home];
  private layout?: Layout;

  async init() {
    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      // Any of the widget columns; the layout moves it where it belongs.
      anchor: () =>
        document.querySelector('main#feed, aside#feed-left, aside#feed-right'),
      append: 'last',
      inheritStyles: true,
      onMount: (container, _shadow, host) => {
        const wrapper = document.createElement('div');
        container.append(wrapper);
        syncUserTheme(container);

        this.layout = new Layout(host);
        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <FriendsActivityBlock />
          </QueryClientProvider>,
        );
        return root;
      },
      onRemove: (root) => {
        this.layout?.stop();
        this.layout = undefined;
        root?.unmount();
        useBlockView.setState({ visible: false });
      },
    });
  }
}
