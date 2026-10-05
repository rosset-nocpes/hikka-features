import {
  QueryClientProvider,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import MaterialSymbolsLiveTvRounded from '~icons/material-symbols/live-tv-rounded';

import { useSettings } from '@/hooks/use-settings';
import {
  type ReleaseNotification,
  type ReleaseNotificationMenu,
  convexApi,
} from '@/utils/convex-api';
import { accountMutation, accountQuery } from '@/utils/convex-client';

import { queryClient } from '..';
import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

const POLL_INTERVAL_MS = 5 * 60 * 1_000;
const BELL_PATH_PREFIX = 'M5 19q';
const HIKKA_PROFILE_URL = 'https://api.hikka.io/user/me';
const EMPTY_MENU: ReleaseNotificationMenu = {
  notifications: [],
  unseenCount: 0,
};

interface NativeCount {
  count: number;
  saturated: boolean;
}

interface BadgeTarget extends NativeCount {
  container: HTMLElement;
  nativeBadge?: HTMLElement;
  placement: 'desktop' | 'mobile';
}

interface MenuTarget extends NativeCount {
  list: HTMLElement;
  header: HTMLElement;
  titleGroup: HTMLElement;
  nativeBadge?: HTMLElement;
  nativeMarkAll?: HTMLButtonElement;
  emptyState?: HTMLElement;
}

interface NotificationDom {
  badges: BadgeTarget[];
  menu?: MenuTarget;
}

export default class ReleaseNotificationsFeature extends BaseFeature {
  readonly id = 'release-notifications-menu';
  readonly pages = [HikkaPages.All];

  async init() {
    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      anchor: 'body',
      append: 'last',
      css: ':host { display: none !important; }',
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <ReleaseNotificationsController />
          </QueryClientProvider>,
        );
        return root;
      },
      onRemove: (root) => root?.unmount(),
    });
    this.mount();
  }
}

/**
 * Merges favorite-team release notifications into hikka.io's native
 * notification bell and menu.
 */
const ReleaseNotificationsController = () => {
  const signedIn = useSettings((state) => Boolean(state.convexSession));
  const hikkaId = useSettings((state) => state.userData?.hikkaId);
  const [dom, setDom] = useState<NotificationDom>({ badges: [] });
  const queryKey = ['release-notifications', hikkaId];
  const enabled = signedIn && hikkaId !== undefined;

  const { data = EMPTY_MENU, refetch } = useQuery({
    queryKey,
    enabled,
    // Only show the extension account's notifications to that Hikka user.
    queryFn: async () =>
      (await getHikkaViewerId()) === hikkaId
        ? await accountQuery(convexApi.notifications.menu, { limit: 50 })
        : EMPTY_MENU,
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  });

  const { mutate: markAllSeen, isPending: markingAllSeen } = useMutation({
    mutationFn: () => accountMutation(convexApi.notifications.markAllSeen, {}),
    // Keep an in-flight poll from overwriting the cleared state.
    onMutate: () => queryClient.cancelQueries({ queryKey }),
    onSuccess: () =>
      queryClient.setQueryData<ReleaseNotificationMenu>(queryKey, (menu) =>
        menu
          ? {
              notifications: menu.notifications.map((notification) => ({
                ...notification,
                seen: true,
              })),
              unseenCount: 0,
            }
          : menu,
      ),
    onError: (error) =>
      console.error('Failed to mark release notifications as seen', error),
  });
  const hasUnseen = data.unseenCount > 0;

  const markSeen = (notification: ReleaseNotification) => {
    if (notification.seen) return;
    accountMutation(convexApi.notifications.markSeen, { id: notification.id })
      .then(() => refetch())
      .catch((error) =>
        console.error('Failed to mark release notification as seen', error),
      );
  };

  useEffect(() => {
    const scan = () => {
      const next = findNotificationDom();
      setDom((current) =>
        sameNotificationDom(current, next) ? current : next,
      );
    };
    const observer = new MutationObserver(scan);
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    scan();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dom.menu && enabled) void refetch();
  }, [dom.menu, enabled, refetch]);

  useEffect(() => {
    const restore: Array<() => void> = [];

    if (data.notifications.length > 0 && dom.menu?.emptyState) {
      restore.push(hideNativeElement(dom.menu.emptyState));
    }

    if (data.unseenCount > 0) {
      for (const target of dom.badges) {
        if (target.nativeBadge) {
          restore.push(hideNativeElement(target.nativeBadge));
        }
      }
      if (dom.menu?.nativeBadge) {
        restore.push(hideNativeElement(dom.menu.nativeBadge));
      }
    }

    return () => restore.forEach((show) => show());
  }, [data.notifications.length, data.unseenCount, dom]);

  // Hikka's own "mark all read" button also clears extension notifications.
  useEffect(() => {
    if (!hasUnseen || markingAllSeen) return;
    const handleNativeMarkAll = (event: MouseEvent) => {
      const button =
        event.target instanceof Element ? event.target.closest('button') : null;
      if (
        button &&
        !button.hasAttribute('data-hf-release-mark-all') &&
        button.textContent?.trim() === 'Прочитати всі' &&
        button.closest(
          '[data-slot="dropdown-menu-content"], [data-slot="drawer-content"]',
        )
      ) {
        markAllSeen();
      }
    };

    document.addEventListener('click', handleNativeMarkAll, true);
    return () =>
      document.removeEventListener('click', handleNativeMarkAll, true);
  }, [hasUnseen, markingAllSeen, markAllSeen]);

  return (
    <>
      {data.unseenCount > 0 &&
        dom.badges.map((target) =>
          createPortal(
            <NotificationCount
              count={target.count + data.unseenCount}
              saturated={target.saturated}
              placement={target.placement}
            />,
            target.container,
            target.placement,
          ),
        )}

      {dom.menu && data.unseenCount > 0
        ? createPortal(
            <HeaderNotificationCount
              count={dom.menu.count + data.unseenCount}
              saturated={dom.menu.saturated}
            />,
            dom.menu.titleGroup,
          )
        : null}

      {dom.menu && data.unseenCount > 0 && !dom.menu.nativeMarkAll
        ? createPortal(
            <button
              type="button"
              data-hf-release-mark-all
              className="border-border bg-background hover:bg-accent inline-flex shrink-0 items-center justify-center rounded-full border px-3.5 py-1 text-xs font-medium disabled:pointer-events-none disabled:opacity-50"
              disabled={markingAllSeen}
              onClick={() => markAllSeen()}
            >
              Прочитати всі
            </button>,
            dom.menu.header,
          )
        : null}

      {dom.menu && data.notifications.length > 0
        ? createPortal(
            <ReleaseNotificationSection
              notifications={data.notifications}
              onNotificationClick={markSeen}
            />,
            dom.menu.list,
          )
        : null}
    </>
  );
};

const ReleaseNotificationSection = ({
  notifications,
  onNotificationClick,
}: {
  notifications: ReleaseNotification[];
  onNotificationClick: (notification: ReleaseNotification) => void;
}) => (
  <div data-hf-release-notifications>
    <div className="border-border surface-inset text-muted-foreground border-b px-3 py-1.5 text-xs font-medium">
      Улюблені команди
    </div>
    {notifications.map((notification) => {
      const description = `Команда «${notification.teamTitle}» випустила серію ${notification.episodeNumber}`;
      return (
        <div
          key={notification.id}
          className={`group/item border-border hover:bg-muted flex gap-3 border-t border-l-4 px-3 py-2.5 transition-colors first:border-t-0 ${
            notification.seen
              ? 'border-l-transparent'
              : 'border-l-primary-foreground/60 bg-primary-foreground/10'
          }`}
        >
          <div className="relative size-10 shrink-0">
            <div className="border-border bg-secondary/40 flex size-10 items-center justify-center rounded-md border [&_svg]:size-5">
              <MaterialSymbolsLiveTvRounded />
            </div>
          </div>

          <div className="relative flex min-w-0 flex-1 flex-col gap-1">
            <a
              href={`/anime/${notification.animeSlug}`}
              aria-label={notification.animeTitle ?? 'Новий епізод'}
              className="absolute inset-0 z-10"
              onClick={() => onNotificationClick(notification)}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm leading-tight font-medium">
                {notification.animeTitle ?? 'Новий епізод'}
              </span>
            </div>
            <p className="text-muted-foreground group-hover/item:text-foreground line-clamp-2 text-xs">
              {description}
            </p>
            {notification.episodeTitle && (
              <p className="border-muted-foreground/20 text-muted-foreground line-clamp-1 border-l-2 pl-2 text-xs">
                {notification.episodeTitle}
              </p>
            )}
            <time
              dateTime={new Date(notification.createdAt).toISOString()}
              title={new Date(notification.createdAt).toLocaleString('uk-UA')}
              className="text-muted-foreground shrink-0 text-xs opacity-60 group-hover/item:opacity-100"
            >
              {formatRelativeTime(notification.createdAt)}
            </time>
          </div>
        </div>
      );
    })}
  </div>
);

const NotificationCount = ({
  count,
  saturated,
  placement,
}: NativeCount & { placement: BadgeTarget['placement'] }) => (
  <span
    data-hf-release-count
    className={`border-warning-border bg-warning text-warning-foreground absolute flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[0.625rem] leading-none font-bold tabular-nums ${
      placement === 'mobile' ? '-top-1 -right-2' : '-right-1 -bottom-1'
    }`}
  >
    {formatCount(count, saturated)}
  </span>
);

const HeaderNotificationCount = ({ count, saturated }: NativeCount) => (
  <div
    data-hf-release-header-count
    className="border-warning-border bg-warning text-warning-foreground inline-flex w-fit shrink-0 items-center justify-center overflow-hidden rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap"
  >
    {formatCount(count, saturated)}
  </div>
);

function findNotificationDom(): NotificationDom {
  return {
    badges: findBadgeTargets(),
    menu: findMenuTarget(),
  };
}

function findBadgeTargets(): BadgeTarget[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="dropdown-menu-trigger"], [data-slot="drawer-trigger"]',
    ),
  ).flatMap((trigger) => {
    const bellPath = Array.from(trigger.querySelectorAll('path')).find((path) =>
      path.getAttribute('d')?.startsWith(BELL_PATH_PREFIX),
    );
    if (!bellPath) return [];

    const mobile = trigger.dataset.slot === 'drawer-trigger';
    const iconContainer = bellPath.closest('svg')?.parentElement;
    const container =
      mobile && iconContainer?.classList.contains('relative')
        ? iconContainer
        : trigger;
    const nativeBadge = findNativeCountBadge(container);
    return [
      {
        container,
        nativeBadge,
        placement: mobile ? 'mobile' : 'desktop',
        ...parseNativeCount(nativeBadge),
      },
    ];
  });
}

function findMenuTarget(): MenuTarget | undefined {
  const roots = document.querySelectorAll<HTMLElement>(
    '[data-slot="dropdown-menu-content"], [data-slot="drawer-content"]',
  );
  for (const root of roots) {
    const title = Array.from(root.querySelectorAll('span')).find(
      (candidate) => candidate.textContent?.trim() === 'Сповіщення',
    );
    const list = root.querySelector<HTMLElement>(
      '.no-scrollbar.overflow-y-auto',
    );
    const titleGroup = title?.parentElement;
    const header = titleGroup?.parentElement;
    if (!list || !titleGroup || !header) continue;

    const nativeBadge = findNativeCountBadge(titleGroup);
    const nativeMarkAll = Array.from(
      header.querySelectorAll<HTMLButtonElement>('button'),
    ).find(
      (button) =>
        !button.hasAttribute('data-hf-release-mark-all') &&
        button.textContent?.trim() === 'Прочитати всі',
    );
    return {
      list,
      header,
      titleGroup,
      nativeBadge,
      nativeMarkAll,
      emptyState:
        list.querySelector<HTMLElement>(':scope > [data-slot="empty"]') ??
        undefined,
      ...parseNativeCount(nativeBadge),
    };
  }
  return undefined;
}

function findNativeCountBadge(container: HTMLElement): HTMLElement | undefined {
  return Array.from(
    container.querySelectorAll<HTMLElement>('.bg-warning'),
  ).find(
    (candidate) =>
      !candidate.hasAttribute('data-hf-release-count') &&
      !candidate.hasAttribute('data-hf-release-header-count') &&
      /^\d+(?:\+)?$/.test(candidate.textContent?.trim() ?? ''),
  );
}

function parseNativeCount(element?: HTMLElement): NativeCount {
  const label = element?.textContent?.trim() ?? '';
  return {
    count: Number.parseInt(label, 10) || 0,
    saturated: label.endsWith('+'),
  };
}

function sameNotificationDom(current: NotificationDom, next: NotificationDom) {
  if (!sameMenuTarget(current.menu, next.menu)) return false;
  if (current.badges.length !== next.badges.length) return false;
  return current.badges.every((badge, index) => {
    const candidate = next.badges[index];
    return (
      candidate !== undefined &&
      badge.container === candidate.container &&
      badge.nativeBadge === candidate.nativeBadge &&
      badge.placement === candidate.placement &&
      badge.count === candidate.count &&
      badge.saturated === candidate.saturated
    );
  });
}

function sameMenuTarget(current?: MenuTarget, next?: MenuTarget) {
  if (!current || !next) return current === next;
  return (
    current.list === next.list &&
    current.header === next.header &&
    current.titleGroup === next.titleGroup &&
    current.nativeBadge === next.nativeBadge &&
    current.nativeMarkAll === next.nativeMarkAll &&
    current.emptyState === next.emptyState &&
    current.count === next.count &&
    current.saturated === next.saturated
  );
}

function hideNativeElement(element: HTMLElement) {
  const wasHidden = element.hidden;
  element.hidden = true;
  return () => {
    element.hidden = wasHidden;
  };
}

function formatCount(count: number, saturated: boolean) {
  return saturated || count >= 100 ? '99+' : count;
}

function formatRelativeTime(createdAt: number) {
  const seconds = (createdAt - Date.now()) / 1_000;
  const formatter = new Intl.RelativeTimeFormat('uk', { numeric: 'auto' });
  if (Math.abs(seconds) < 45) return 'щойно';
  if (Math.abs(seconds) < 60 * 60) {
    return formatter.format(Math.round(seconds / 60), 'minute');
  }
  if (Math.abs(seconds) < 24 * 60 * 60) {
    return formatter.format(Math.round(seconds / (60 * 60)), 'hour');
  }
  if (Math.abs(seconds) < 30 * 24 * 60 * 60) {
    return formatter.format(Math.round(seconds / (24 * 60 * 60)), 'day');
  }
  return new Date(createdAt).toLocaleDateString('uk-UA');
}

async function getHikkaViewerId() {
  const response = await fetch(HIKKA_PROFILE_URL, {
    cache: 'no-store',
    credentials: 'include',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return undefined;

  const profile = (await response.json()) as { reference?: unknown };
  return typeof profile.reference === 'string' ? profile.reference : undefined;
}
