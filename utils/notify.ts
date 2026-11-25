import type { ReactNode } from 'react';

import { create } from 'zustand';

export type NotificationTone =
  | 'default'
  | 'success'
  | 'info'
  | 'warning'
  | 'error';

/** Why a notification went away, for `onDismiss`. */
export type DismissReason =
  /** The close button, a swipe or Escape. */
  | 'user'
  | 'timeout'
  /** One of its actions was clicked. */
  | 'action'
  /** `notify.dismiss` or a newer notification pushing it out. */
  | 'code';

export interface NotificationAction {
  label: string;
  icon?: ReactNode;
  /** The notification's main action, drawn filled; one at most. */
  primary?: boolean;
  /** Resolves before the notification closes; a spinner shows meanwhile. */
  onClick: () => unknown;
  /** Keeps the notification after the click; it closes by default. */
  keepOpen?: boolean;
}

export interface NotificationOptions {
  /**
   * Notifying again with the same id updates it in place and restarts its
   * timer, e.g. for progress or to avoid duplicates.
   */
  id?: string;
  /** A short line over the title: what kind of notification it is. */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Leads the notification: an avatar, a poster or an icon. The tone's icon by default. */
  media?: ReactNode;
  tone?: NotificationTone;
  actions?: NotificationAction[];
  /**
   * How long it stays, in ms; `Infinity` keeps it until it is dismissed.
   * The timer pauses while the stack is hovered or the tab is hidden.
   */
  duration?: number;
  /** Whether the user may close it themselves. True by default. */
  dismissible?: boolean;
  /** Announced at once by screen readers, for what needs an answer. */
  urgent?: boolean;
  onDismiss?: (reason: DismissReason) => void;
}

export interface AppNotification extends NotificationOptions {
  id: string;
  /** Bumped by every update, which restarts the timer. */
  version: number;
}

/** How long a notification stays by default, and with actions to take. */
export const NOTIFICATION_DURATION = 6_000;
export const NOTIFICATION_ACTIONS_DURATION = 10_000;
/** Older notifications past this many are dropped. */
const MAX_NOTIFICATIONS = 20;

export const durationOf = (notification: NotificationOptions) =>
  notification.duration ??
  (notification.actions?.length
    ? NOTIFICATION_ACTIONS_DURATION
    : NOTIFICATION_DURATION);

/** Newest first. */
export const useNotifications = create<{ notifications: AppNotification[] }>(
  () => ({ notifications: [] }),
);

let lastId = 0;

const remove = (id: string, reason: DismissReason) => {
  const { notifications } = useNotifications.getState();
  const notification = notifications.find((item) => item.id === id);
  if (!notification) return;
  useNotifications.setState({
    notifications: notifications.filter((item) => item !== notification),
  });
  notification.onDismiss?.(reason);
};

/**
 * Shows a notification in the stack in the corner of every hikka.io page,
 * over the player too; returns its id.
 */
export const notify = Object.assign(
  (options: NotificationOptions): string => {
    const { notifications } = useNotifications.getState();
    const id = options.id ?? `notification-${(lastId += 1)}`;
    const existing = notifications.find((item) => item.id === id);

    if (existing) {
      // Updated in place: it keeps its spot in the stack.
      useNotifications.setState({
        notifications: notifications.map((item) =>
          item === existing
            ? { ...options, id, version: existing.version + 1 }
            : item,
        ),
      });
      return id;
    }

    const next = [{ ...options, id, version: 0 }, ...notifications];
    const dropped = next.splice(MAX_NOTIFICATIONS);
    useNotifications.setState({ notifications: next });
    for (const item of dropped) item.onDismiss?.('code');
    return id;
  },
  {
    success: (title: ReactNode, options?: Omit<NotificationOptions, 'title'>) =>
      notify({ ...options, title, tone: 'success' }),
    info: (title: ReactNode, options?: Omit<NotificationOptions, 'title'>) =>
      notify({ ...options, title, tone: 'info' }),
    warning: (title: ReactNode, options?: Omit<NotificationOptions, 'title'>) =>
      notify({ ...options, title, tone: 'warning' }),
    error: (title: ReactNode, options?: Omit<NotificationOptions, 'title'>) =>
      notify({ ...options, title, tone: 'error' }),

    /** Takes the notification away, or every one without an id. */
    dismiss: (id?: string, reason: DismissReason = 'code') => {
      if (id !== undefined) return remove(id, reason);
      for (const item of useNotifications.getState().notifications) {
        remove(item.id, reason);
      }
    },

    /** Whether the notification is still shown. */
    isActive: (id: string) =>
      useNotifications.getState().notifications.some((item) => item.id === id),
  },
);
