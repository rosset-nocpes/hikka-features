import { type ReactNode, useEffect, useState } from 'react';

import { AnchoredUisFeature, renderApp } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import { MenuFeed, hideNativeElement } from './menu-feed';
import { useReleaseNotifications } from './use-release-notifications';

const BELL_PATH_PREFIX = 'M5 19q';
const MENU_SELECTOR =
  '[data-slot="dropdown-menu-content"], [data-slot="drawer-content"]';
const MARK_ALL_LABEL = 'Прочитати всі';

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
    render: (anchor) => <MenuFeed list={anchor} />,
  },
];

/**
 * Merges favorite-team release notifications into Hikka's notification bell
 * and menu, where they sit among Hikka's own by time (see `feed-layout.ts`).
 * Each piece is rendered into Hikka's own DOM, so Hikka's styles apply,
 * whenever its anchor is on the page: the menu's pieces are mounted again
 * every time it opens.
 */
export default class ReleaseNotificationsFeature extends AnchoredUisFeature {
  readonly id = 'release-notifications';
  readonly pages = [HikkaPages.All];

  async init() {
    const { ctx } = usePageStore.getState();
    this.uis = TARGETS.map((target) => {
      const ui = createIntegratedUi(ctx, {
        tag: this.id,
        position: 'inline',
        anchor: target.find,
        append: target.append,
        onMount(wrapper) {
          // Lays the UI out as if it were the anchor's own children.
          wrapper.style.display = 'contents';
          return renderApp(wrapper, target.render(wrapper.parentElement!));
        },
        onRemove: (root) => root?.unmount(),
      });
      return { present: () => !!target.find(), ui, element: () => ui.wrapper };
    });
  }
}

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

/**
 * Hikka shows its own button only while it has unread notifications, and
 * that one clears release notifications as well.
 */
const MarkAllButton = ({ header }: { header: HTMLElement }) => {
  const { data, markAllSeen, markingAllSeen } = useReleaseNotifications();
  const nativeMarkAll = useDomValue(header, () => findNativeMarkAll(header));
  const hasUnseen = data.unseenCount > 0;

  useEffect(() => {
    if (!nativeMarkAll || !hasUnseen || markingAllSeen) return;
    const onClick = () => markAllSeen();
    nativeMarkAll.addEventListener('click', onClick);
    return () => nativeMarkAll.removeEventListener('click', onClick);
  }, [nativeMarkAll, hasUnseen, markingAllSeen, markAllSeen]);

  if (!hasUnseen || nativeMarkAll) return null;

  return (
    <button
      type="button"
      data-hf-release-mark-all
      className="border-border bg-background hover:bg-accent inline-flex shrink-0 items-center justify-center rounded-full border px-3.5 py-1 text-xs font-medium disabled:pointer-events-none disabled:opacity-50"
      disabled={markingAllSeen}
      onClick={() => markAllSeen()}
    >
      {MARK_ALL_LABEL}
    </button>
  );
};

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
      button.textContent?.trim() === MARK_ALL_LABEL,
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

function formatCount(count: number, saturated: boolean) {
  return saturated || count >= 100 ? '99+' : count;
}
