import { NotificationStack } from '@/components/notifications/notification-stack';

import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

/**
 * The extension's notifications (see `notify`), stacked in a corner of
 * every page and over the player.
 */
export default class NotificationsFeature extends BaseFeature {
  readonly id = 'hikka-features-notifications';
  readonly pages = [HikkaPages.All];

  async init() {
    this.ui = await this.createUi({
      position: 'inline',
      anchor: 'body',
      append: 'last',
      themeVariables: false,
      render: () => <NotificationStack />,
    });
  }
}
