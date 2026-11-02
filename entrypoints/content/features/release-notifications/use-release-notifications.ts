import { useMemo } from 'react';
import { create } from 'zustand';

import { useLiveQuery } from '@/hooks/use-live-query';
import {
  type ReleaseNotification,
  type ReleaseNotificationMenu,
  convexApi,
} from '@/utils/convex-api';
import { liveConvex } from '@/utils/convex-client';
import { useHikkaViewer } from '@/utils/hikka-viewer';

const MENU_ARGS = { limit: 50 };
const EMPTY_MENU: ReleaseNotificationMenu = {
  notifications: [],
  unseenCount: 0,
};

/**
 * Notifications marked seen whose mutation hasn't reached the live query
 * yet, shared by every piece of the menu so they all show it at once.
 */
const usePendingSeen = create<{
  ids: ReadonlySet<string>;
  all: boolean;
}>(() => ({ ids: new Set(), all: false }));

const setPendingId = (id: string, pending: boolean) =>
  usePendingSeen.setState(({ ids }) => {
    const next = new Set(ids);
    if (pending) next.add(id);
    else next.delete(id);
    return { ids: next };
  });

/** The menu with the pending ones shown as seen already. */
const withPendingSeen = (
  menu: ReleaseNotificationMenu,
  ids: ReadonlySet<string>,
  all: boolean,
): ReleaseNotificationMenu => {
  if (!all && ids.size === 0) return menu;
  const isMarked = (notification: ReleaseNotification) =>
    all || ids.has(notification.id);
  const marked = menu.notifications.filter(
    (notification) => !notification.seen && isMarked(notification),
  ).length;
  return {
    notifications: menu.notifications.map((notification) =>
      isMarked(notification) ? { ...notification, seen: true } : notification,
    ),
    // Marking all also clears the ones past the loaded page.
    unseenCount: all ? 0 : Math.max(0, menu.unseenCount - marked),
  };
};

const markSeen = (notification: ReleaseNotification) => {
  if (notification.seen) return;
  setPendingId(notification.id, true);
  // Settles once the live query shows it.
  void liveConvex
    .mutation(convexApi.notifications.markSeen, { id: notification.id })
    .catch((error) =>
      console.error('Failed to mark release notification as seen', error),
    )
    .finally(() => setPendingId(notification.id, false));
};

const markAllSeen = () => {
  if (usePendingSeen.getState().all) return;
  usePendingSeen.setState({ all: true });
  void liveConvex
    .mutation(convexApi.notifications.markAllSeen, {})
    .catch((error) =>
      console.error('Failed to mark release notifications as seen', error),
    )
    .finally(() => usePendingSeen.setState({ all: false }));
};

/**
 * The account's release notifications, followed live. Only the Hikka user
 * the extension is signed in as sees them.
 */
export const useReleaseNotifications = () => {
  const enabled = useHikkaViewer() === 'account';
  const menu = useLiveQuery(
    convexApi.notifications.menu,
    enabled ? MENU_ARGS : 'skip',
  )?.data;
  const { ids, all } = usePendingSeen();
  const data = useMemo(
    () => withPendingSeen(menu ?? EMPTY_MENU, ids, all),
    [menu, ids, all],
  );

  return { data, markSeen, markAllSeen, markingAllSeen: all };
};
