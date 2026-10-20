import { useSettings } from '@/hooks/use-settings';

import { BaseFeature, createFeatureUi } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import FriendsActivityBlock from './friends-activity-block';
import { HomePlacement, useBlockView } from './home-placement';
import { LayoutDialog } from './layout-dialog';

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
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      // Any of the widget columns; the layout moves it where it belongs.
      anchor: () =>
        document.querySelector('main#feed, aside#feed-left, aside#feed-right'),
      append: 'last',
      onMount: (_container, _wrapper, host) => {
        this.layout = new Layout(host);
      },
      onRemove: () => {
        this.layout?.stop();
        this.layout = undefined;
        useBlockView.setState({ visible: false });
      },
      render: () => <FriendsActivityBlock />,
    });
  }
}
