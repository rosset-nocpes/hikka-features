import { useMutation, useQuery } from '@tanstack/react-query';

import { useSettings } from '@/hooks/use-settings';
import {
  type ReleaseNotification,
  type ReleaseNotificationMenu,
  convexApi,
} from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';
import { getHikkaViewerId } from '@/utils/hikka-viewer';

import { queryClient } from '../../core/query-client';

const POLL_INTERVAL_MS = 5 * 60 * 1_000;
const EMPTY_MENU: ReleaseNotificationMenu = {
  notifications: [],
  unseenCount: 0,
};

/** The cached menu with some of its notifications marked seen. */
const markCachedSeen = (
  menu: ReleaseNotificationMenu,
  isMarked: (notification: ReleaseNotification) => boolean,
): ReleaseNotificationMenu => {
  const marked = menu.notifications.filter(
    (notification) => !notification.seen && isMarked(notification),
  ).length;
  return {
    notifications: menu.notifications.map((notification) =>
      isMarked(notification) ? { ...notification, seen: true } : notification,
    ),
    unseenCount: Math.max(0, menu.unseenCount - marked),
  };
};

/** The account's release notifications; every piece shares the cache. */
export const useReleaseNotifications = () => {
  const signedIn = useSettings((state) => Boolean(state.convexSession));
  const hikkaId = useSettings((state) => state.userData?.hikkaId);
  const queryKey = ['release-notifications', hikkaId];
  const enabled = signedIn && hikkaId !== undefined;

  const { data = EMPTY_MENU, refetch } = useQuery({
    queryKey,
    enabled,
    // Only show the extension account's notifications to that Hikka user.
    queryFn: async () =>
      (await getHikkaViewerId()) === hikkaId
        ? await convex.accountQuery(convexApi.notifications.menu, { limit: 50 })
        : EMPTY_MENU,
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  });

  const { mutate: markAllSeen, isPending: markingAllSeen } = useMutation({
    mutationFn: () =>
      convex.accountMutation(convexApi.notifications.markAllSeen, {}),
    // Keep an in-flight poll from overwriting the cleared state.
    onMutate: () => queryClient.cancelQueries({ queryKey }),
    onSuccess: () =>
      queryClient.setQueryData<ReleaseNotificationMenu>(
        queryKey,
        (menu) =>
          // Also counts the ones past the loaded page.
          menu && { ...markCachedSeen(menu, () => true), unseenCount: 0 },
      ),
    onError: (error) =>
      console.error('Failed to mark release notifications as seen', error),
  });

  const markSeen = (notification: ReleaseNotification) => {
    if (notification.seen) return;
    void queryClient.cancelQueries({ queryKey });
    queryClient.setQueryData<ReleaseNotificationMenu>(
      queryKey,
      (menu) =>
        menu && markCachedSeen(menu, (other) => other.id === notification.id),
    );
    convex
      .accountMutation(convexApi.notifications.markSeen, {
        id: notification.id,
      })
      .catch((error) =>
        console.error('Failed to mark release notification as seen', error),
      )
      .finally(() => refetch());
  };

  return { data, enabled, refetch, markSeen, markAllSeen, markingAllSeen };
};
