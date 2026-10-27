import type { MouseEvent, ReactNode } from 'react';

import MaterialSymbolsGroupsRounded from '~icons/material-symbols/groups-rounded';

import {
  isTeamPagePath,
  onHikkaLinkClick,
  teamPagePath,
} from '@/utils/hikka-router';

import { AnchoredUisFeature, renderApp } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

/** hikka.io's dropdown items under "Спільнота" (`nav-menu.tsx`). */
const DROPDOWN_ITEM =
  'inline-flex shrink-0 items-center whitespace-nowrap font-medium outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-auto w-full justify-start gap-2 rounded-sm border px-2 py-1.5 text-sm';
const DROPDOWN_IDLE =
  'border-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 text-muted-foreground';
const DROPDOWN_ACTIVE =
  'border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground dark:hover:bg-primary-foreground/20';

/** hikka.io's rows in the mobile "Ще" drawer (`nav-styles.ts`). */
const DRAWER_ROW =
  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors text-muted-foreground hover:bg-accent hover:text-foreground data-[active=true]:bg-primary-foreground/15 data-[active=true]:font-medium data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary-foreground/20 data-[active=true]:hover:text-primary-foreground [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0';

const LABEL = 'Команди';
const COMMUNITY_LINK = 'a[href^="/collections"], a[href^="/articles"]';

/** The open "Спільнота" dropdown's list. */
const findDropdown = () =>
  [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="navigation-menu-content"] ul',
    ),
  ].find((list) => list.querySelector(COMMUNITY_LINK));

/** The "Спільнота" group of the open mobile drawer. */
const findDrawerGroup = () =>
  [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="drawer-content"] span',
    ),
  ].find(
    (label) =>
      label.textContent?.trim() === 'Спільнота' &&
      label.parentElement?.querySelector(COMMUNITY_LINK),
  )?.parentElement ?? undefined;

const DropdownItem = () => {
  const active = isTeamPagePath(useLocationPath());
  return (
    <li>
      <a
        href={teamPagePath()}
        onClick={onHikkaLinkClick}
        aria-current={active ? 'page' : undefined}
        className={`${DROPDOWN_ITEM} ${active ? DROPDOWN_ACTIVE : DROPDOWN_IDLE}`}
      >
        <MaterialSymbolsGroupsRounded />
        {LABEL}
      </a>
    </li>
  );
};

/** The drawer closes on Escape, as hikka.io's own rows close it. */
const closeDrawer = (event: MouseEvent<HTMLAnchorElement>) => {
  onHikkaLinkClick(event);
  event.currentTarget.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
};

const DrawerRow = () => {
  const active = isTeamPagePath(useLocationPath());
  return (
    <a
      href={teamPagePath()}
      onClick={closeDrawer}
      data-active={active}
      aria-current={active ? 'page' : undefined}
      className={DRAWER_ROW}
    >
      <MaterialSymbolsGroupsRounded />
      <span>{LABEL}</span>
    </a>
  );
};

const TARGETS: { find: () => HTMLElement | undefined; render: ReactNode }[] = [
  { find: findDropdown, render: <DropdownItem /> },
  { find: findDrawerGroup, render: <DrawerRow /> },
];

/**
 * "Команди", the list of teams, under "Спільнота" in hikka.io's navbar and
 * its mobile drawer. Both are only on the page while open, so the item is
 * added each time they open, into hikka.io's own DOM for its styles.
 */
export default class TeamsNavLinkFeature extends AnchoredUisFeature {
  readonly id = 'teams-nav-link';
  readonly pages = [HikkaPages.All];

  async init() {
    const { ctx } = usePageStore.getState();
    this.uis = TARGETS.map((target) => {
      const ui = createIntegratedUi(ctx, {
        tag: this.id,
        position: 'inline',
        anchor: target.find,
        onMount(wrapper) {
          // Lays the item out as one of the list's own.
          wrapper.style.display = 'contents';
          return renderApp(wrapper, target.render);
        },
        onRemove: (root) => root?.unmount(),
      });
      return { present: () => !!target.find(), ui, element: () => ui.wrapper };
    });
  }
}
