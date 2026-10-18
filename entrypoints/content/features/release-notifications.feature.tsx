import type { Root } from 'react-dom/client';

import {
  QueryClientProvider,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
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
const MENU_SELECTOR =
  '[data-slot="dropdown-menu-content"], [data-slot="drawer-content"]';
const TRANSLATION_SUFFIX = {
  dub: ' в озвученні',
  sub: ' із субтитрами',
  unknown: '',
} satisfies Record<NonNullable<ReleaseNotification['translationType']>, string>;
const EMPTY_MENU: ReleaseNotificationMenu = {
  notifications: [],
  unseenCount: 0,
};

type Placement = 'desktop' | 'mobile';

interface NativeCount {
  count: number;
  saturated: boolean;
}

/** A piece of UI and the element of Hikka's it is appended to. */
interface Target {
  /** The anchor, or undefined while it is not on the page. */
  find: () => HTMLElement | undefined;
  render: (anchor: HTMLElement) => ReactNode;
  append?: ContentScriptAppendMode;
}

const TARGETS: Target[] = [
  {
    find: () => findBell('desktop'),
    render: (anchor) => <BellCount container={anchor} placement="desktop" />,
  },
  {
    find: () => findBell('mobile'),
    render: (anchor) => <BellCount container={anchor} placement="mobile" />,
  },
  // The menu is only on the page while it is open.
  {
    find: () => findMenu()?.titleGroup,
    render: (anchor) => <MenuCount titleGroup={anchor} />,
  },
  {
    find: () => findMenu()?.header,
    render: (anchor) => <MarkAllButton header={anchor} />,
  },
  {
    find: () => findMenu()?.list,
    append: 'first',
    render: (anchor) => <MenuSection list={anchor} />,
  },
];

/**
 * Merges favorite-team release notifications into Hikka's notification bell
 * and menu. Each piece is rendered into Hikka's own DOM, so Hikka's styles
 * apply, whenever its anchor is on the page: the menu's pieces are mounted
 * again every time it opens.
 */
export default class ReleaseNotificationsFeature extends BaseFeature {
  readonly id = 'release-notifications';
  readonly pages = [HikkaPages.All];
  private uis: { target: Target; ui: IntegratedContentScriptUi<Root> }[] = [];

  async init() {
    const { ctx } = usePageStore.getState();
    this.uis = TARGETS.map((target) => ({
      target,
      ui: createIntegratedUi(ctx, {
        tag: this.id,
        position: 'inline',
        anchor: target.find,
        append: target.append,
        onMount(wrapper) {
          // Lays the UI out as if it were the anchor's own children.
          wrapper.style.display = 'contents';

          const root = createRoot(wrapper);
          root.render(
            <QueryClientProvider client={queryClient}>
              {target.render(wrapper.parentElement!)}
            </QueryClientProvider>,
          );
          return root;
        },
        onRemove: (root) => root?.unmount(),
      }),
    }));
    this.mount();
  }

  override get isMounted(): boolean {
    const available = this.uis.filter(({ target }) => target.find());
    return (
      available.length > 0 &&
      available.every(({ ui }) => ui.mounted && ui.wrapper.isConnected)
    );
  }

  override mount() {
    for (const { target, ui } of this.uis) {
      if (!target.find()) continue;
      if (ui.mounted && ui.wrapper.isConnected) continue;
      // Hikka removed the anchor along with the UI; start over in the new one.
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

/** The account's release notifications; every piece shares the cache. */
const useReleaseNotifications = () => {
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

  const markSeen = (notification: ReleaseNotification) => {
    if (notification.seen) return;
    accountMutation(convexApi.notifications.markSeen, { id: notification.id })
      .then(() => refetch())
      .catch((error) =>
        console.error('Failed to mark release notification as seen', error),
      );
  };

  return { data, enabled, refetch, markSeen, markAllSeen, markingAllSeen };
};

/** Reads Hikka's DOM again whenever anything under `root` changes. */
const useDomValue = <T,>(root: HTMLElement, read: () => T) => {
  const [value, setValue] = useState(read);

  useEffect(() => {
    const update = () => setValue(() => read());
    const observer = new MutationObserver(update);
    observer.observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    update();
    return () => observer.disconnect();
  }, [root, read]);

  return value;
};

/** Hikka's own count badge under `root`, hidden while ours replaces it. */
const useNativeCount = (root: HTMLElement, replaced: boolean) => {
  const badge = useDomValue(root, () => findNativeCountBadge(root));
  const label = useDomValue(
    root,
    () => findNativeCountBadge(root)?.textContent?.trim() ?? '',
  );

  useEffect(() => {
    if (badge && replaced) return hideNativeElement(badge);
  }, [badge, replaced]);

  return parseNativeCount(label);
};

const BellCount = ({
  container,
  placement,
}: {
  container: HTMLElement;
  placement: Placement;
}) => {
  const { data } = useReleaseNotifications();
  const native = useNativeCount(container, data.unseenCount > 0);
  if (data.unseenCount === 0) return null;

  return (
    <NotificationCount
      count={native.count + data.unseenCount}
      saturated={native.saturated}
      placement={placement}
    />
  );
};

const MenuCount = ({ titleGroup }: { titleGroup: HTMLElement }) => {
  const { data } = useReleaseNotifications();
  const native = useNativeCount(titleGroup, data.unseenCount > 0);
  if (data.unseenCount === 0) return null;

  return (
    <HeaderNotificationCount
      count={native.count + data.unseenCount}
      saturated={native.saturated}
    />
  );
};

/** Hikka shows its own button only while it has unread notifications. */
const MarkAllButton = ({ header }: { header: HTMLElement }) => {
  const { data, markAllSeen, markingAllSeen } = useReleaseNotifications();
  const nativeMarkAll = useDomValue(header, () => findNativeMarkAll(header));
  if (data.unseenCount === 0 || nativeMarkAll) return null;

  return (
    <button
      type="button"
      data-hf-release-mark-all
      className="border-border bg-background hover:bg-accent inline-flex shrink-0 items-center justify-center rounded-full border px-3.5 py-1 text-xs font-medium disabled:pointer-events-none disabled:opacity-50"
      disabled={markingAllSeen}
      onClick={() => markAllSeen()}
    >
      Прочитати всі
    </button>
  );
};

const MenuSection = ({ list }: { list: HTMLElement }) => {
  const { data, enabled, refetch, markSeen, markAllSeen, markingAllSeen } =
    useReleaseNotifications();
  const emptyState = useDomValue(
    list,
    () =>
      list.querySelector<HTMLElement>(':scope > [data-slot="empty"]') ??
      undefined,
  );
  const hasNotifications = data.notifications.length > 0;
  const hasUnseen = data.unseenCount > 0;

  // Mounted as the menu opens, which is when fresh data matters most.
  useEffect(() => {
    if (enabled) void refetch();
  }, [enabled, refetch]);

  useEffect(() => {
    if (emptyState && hasNotifications) return hideNativeElement(emptyState);
  }, [emptyState, hasNotifications]);

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
        button.closest(MENU_SELECTOR)
      ) {
        markAllSeen();
      }
    };

    document.addEventListener('click', handleNativeMarkAll, true);
    return () =>
      document.removeEventListener('click', handleNativeMarkAll, true);
  }, [hasUnseen, markingAllSeen, markAllSeen]);

  if (!hasNotifications) return null;
  return (
    <ReleaseNotificationSection
      notifications={data.notifications}
      onNotificationClick={markSeen}
    />
  );
};

const ReleaseNotificationSection = ({
  notifications,
  onNotificationClick,
}: {
  notifications: ReleaseNotification[];
  onNotificationClick: (notification: ReleaseNotification) => void;
}) => (
  <div>
    <div className="border-border surface-inset text-muted-foreground border-b px-3 py-1.5 text-xs font-medium">
      Улюблені команди
    </div>
    {notifications.map((notification) => {
      const description = `Команда «${notification.teamTitle}» випустила серію ${notification.episodeNumber}${TRANSLATION_SUFFIX[notification.translationType ?? 'unknown']}`;
      return (
        <div
          key={notification.id}
          className={`group/item border-border hover:bg-muted flex gap-3 border-t border-l-4 px-3 py-2.5 transition-colors first:border-t-0 ${
            notification.seen
              ? 'border-l-transparent'
              : 'border-l-primary-foreground/60 bg-primary-foreground/10'
          }`}
        >
          <div className="border-border bg-secondary/40 flex size-10 shrink-0 items-center justify-center rounded-md border [&_svg]:size-5">
            <MaterialSymbolsLiveTvRounded />
          </div>

          <div className="relative flex min-w-0 flex-1 flex-col gap-1">
            <a
              href={`/anime/${notification.animeSlug}`}
              aria-label={notification.animeTitle ?? 'Новий епізод'}
              className="absolute inset-0 z-10"
              onClick={() => onNotificationClick(notification)}
            />
            <span className="truncate text-sm leading-tight font-medium">
              {notification.animeTitle ?? 'Новий епізод'}
            </span>
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
              className="text-muted-foreground text-xs opacity-60 group-hover/item:opacity-100"
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
}: NativeCount & { placement: Placement }) => (
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

/** The bell's trigger in the header, or the mobile one's icon wrapper. */
function findBell(placement: Placement): HTMLElement | undefined {
  const slot =
    placement === 'mobile' ? 'drawer-trigger' : 'dropdown-menu-trigger';
  for (const trigger of document.querySelectorAll<HTMLElement>(
    `[data-slot="${slot}"]`,
  )) {
    const bellPath = Array.from(trigger.querySelectorAll('path')).find((path) =>
      path.getAttribute('d')?.startsWith(BELL_PATH_PREFIX),
    );
    if (!bellPath) continue;

    const iconContainer = bellPath.closest('svg')?.parentElement;
    return placement === 'mobile' &&
      iconContainer?.classList.contains('relative')
      ? iconContainer
      : trigger;
  }
  return undefined;
}

/** The open notification menu (desktop dropdown or mobile drawer). */
function findMenu() {
  for (const root of document.querySelectorAll<HTMLElement>(MENU_SELECTOR)) {
    const title = Array.from(root.querySelectorAll('span')).find(
      (candidate) => candidate.textContent?.trim() === 'Сповіщення',
    );
    const list = root.querySelector<HTMLElement>(
      '.no-scrollbar.overflow-y-auto',
    );
    const titleGroup = title?.parentElement;
    const header = titleGroup?.parentElement;
    if (list && titleGroup && header) return { list, header, titleGroup };
  }
  return undefined;
}

function findNativeMarkAll(header: HTMLElement) {
  return Array.from(header.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) =>
      !button.hasAttribute('data-hf-release-mark-all') &&
      button.textContent?.trim() === 'Прочитати всі',
  );
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

function parseNativeCount(label: string): NativeCount {
  return {
    count: Number.parseInt(label, 10) || 0,
    saturated: label.endsWith('+'),
  };
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
