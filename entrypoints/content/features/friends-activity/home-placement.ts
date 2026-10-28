import { create } from 'zustand';

import { useSettings } from '@/hooks/use-settings';

import {
  BLOCK_TITLE,
  icon,
  isShown,
  SITE_WIDGETS,
  type Side,
} from './site-layout';

/** Whether the block has something to show, e.g. not to a guest. */
export const useBlockView = create<{ visible: boolean }>(() => ({
  visible: false,
}));

/** The site's chips, for when there is no tab to copy. */
const CHIP_CLASS =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring border border-transparent px-3.5 text-sm backdrop-blur';
const IDLE_CHIP_CLASS = `${CHIP_CLASS} bg-secondary/40 text-muted-foreground hover:bg-accent`;
const ACTIVE_CHIP_CLASS = `${CHIP_CLASS} border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground`;

const TAB_ID = 'widget-tab-friends-activity';

const placement = () => useSettings.getState().features.friendsActivity;

/** The shown copy of a widget: the page renders sidebars twice for widths. */
const shownWidget = (slug: string | null) => {
  const id = slug ? SITE_WIDGETS[slug]?.id : undefined;
  if (!id) return undefined;
  return Array.from(document.querySelectorAll(`[id="${id}"]`)).find(isShown);
};

const shown = (selector: string) =>
  Array.from(document.querySelectorAll(selector)).find(isShown);

/** A column of `side`, or the nearest one, for a block without neighbours. */
function columnFor(side: Side) {
  const columnIn = (aside?: Element) =>
    aside?.querySelector(':scope > div:last-child') ?? undefined;
  const left = columnIn(shown('aside#feed-left'));
  const right = columnIn(shown('aside#feed-right'));
  const center = shown('main#feed');
  if (side === 'center') return center ?? right ?? left;
  if (side === 'left') return left ?? right ?? center;
  return right ?? left ?? center;
}

/**
 * Phones show the sidebars' widgets as tabs above the feed; its tab list is
 * `display: contents`, so its row tells whether it's shown.
 */
const shownTabList = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="tablist"][aria-label="Віджети"]',
    ),
  ).find((list) => isShown(list.parentElement));

/**
 * Keeps the block among the homepage's widgets where the user put it: next
 * to the same neighbours, in whichever copy of the layout the width shows,
 * or as a tab of its own where phones turn sidebars into tabs.
 */
export class HomePlacement {
  private chip?: HTMLButtonElement;
  /** The site's tab list ours is in; a re-render may replace it. */
  private tabList?: HTMLElement;
  private tabActive = false;
  /** The site's tab and panel stepped aside while ours is open. */
  private covered?: {
    tab: HTMLElement;
    className: string;
    panel?: HTMLElement;
  };
  private chipClasses = { idle: IDLE_CHIP_CLASS, active: ACTIVE_CHIP_CLASS };

  /** The block draws its own card; the host only holds its place. */
  constructor(private readonly host: HTMLElement) {
    host.style.minWidth = '0';
  }

  update() {
    const { hidden, side, after, before } = placement();
    const visible = !hidden && useBlockView.getState().visible;
    const tabs = visible && side !== 'center' ? shownTabList() : undefined;

    if (tabs) {
      this.placeAsTab(tabs, side, after, before);
    } else {
      this.removeTab();
      this.placeInColumn(side, after, before);
      this.host.style.display = visible ? 'block' : 'none';
    }
    // Phones show the centre column edge to edge, its cards unrounded.
    this.host.toggleAttribute(
      'data-bleed',
      this.host.parentElement?.id === 'feed',
    );
  }

  stop() {
    this.removeTab();
  }

  private placeInColumn(
    side: Side,
    after: string | null,
    before: string | null,
  ) {
    const previous = shownWidget(after);
    const next = shownWidget(before);
    if (previous) {
      if (previous.nextElementSibling !== this.host) previous.after(this.host);
    } else if (next) {
      if (next.previousElementSibling !== this.host) next.before(this.host);
    } else {
      const column = columnFor(side);
      if (column && column.lastElementChild !== this.host) {
        column.append(this.host);
      }
    }
  }

  private placeAsTab(
    tabs: HTMLElement,
    side: Side,
    after: string | null,
    before: string | null,
  ) {
    const chip = (this.chip ??= this.createChip());
    if (this.tabList !== tabs) {
      // Choosing one of the site's tabs closes ours.
      this.tabList?.removeEventListener('click', this.handleSiteTab, true);
      tabs.addEventListener('click', this.handleSiteTab, true);
      this.tabList = tabs;
    }
    const siteTabs = Array.from(
      tabs.querySelectorAll<HTMLElement>(':scope > [role="tab"]'),
    ).filter((tab) => tab !== chip);
    this.learnChipClasses(siteTabs);

    const previous = after && tabs.querySelector(`#widget-tab-${after}`);
    const next = before && tabs.querySelector(`#widget-tab-${before}`);
    if (previous) {
      if (previous.nextElementSibling !== chip) previous.after(chip);
    } else if (next) {
      if (next.previousElementSibling !== chip) next.before(chip);
    } else if (side === 'left') {
      if (tabs.firstElementChild !== chip) tabs.prepend(chip);
    } else if (tabs.lastElementChild !== chip) {
      tabs.append(chip);
    }

    // The panel sits below the tab row; ours goes right after it.
    const rail = tabs.parentElement!;
    const container = rail.parentElement!;
    const panel = container.querySelector<HTMLElement>(
      ':scope > [role="tabpanel"]',
    );
    const anchor = panel ?? rail;
    if (anchor.nextElementSibling !== this.host) anchor.after(this.host);

    if (this.tabActive && panel && this.covered?.panel !== panel) {
      this.cover(siteTabs, panel);
    }
    this.host.style.display = this.tabActive ? 'block' : 'none';
    chip.className = this.tabActive
      ? this.chipClasses.active
      : this.chipClasses.idle;
    chip.setAttribute('aria-selected', String(this.tabActive));
    chip.tabIndex = this.tabActive ? 0 : -1;
  }

  /** The site's own tabs show what an idle and a chosen tab look like. */
  private learnChipClasses(siteTabs: HTMLElement[]) {
    const idle = siteTabs.find(
      (tab) => tab.getAttribute('aria-selected') === 'false',
    );
    const active = siteTabs.find(
      (tab) =>
        tab.getAttribute('aria-selected') === 'true' &&
        tab !== this.covered?.tab,
    );
    if (idle) this.chipClasses.idle = idle.className;
    if (active) this.chipClasses.active = active.className;
  }

  private createChip() {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.id = TAB_ID;
    chip.setAttribute('role', 'tab');
    chip.setAttribute('aria-controls', 'widget-panel-friends-activity');
    chip.append(icon('users', 'size-4 shrink-0'), BLOCK_TITLE);
    chip.addEventListener('click', () => {
      this.tabActive = true;
      this.update();
    });
    this.host.id = 'widget-panel-friends-activity';
    this.host.setAttribute('role', 'tabpanel');
    this.host.setAttribute('aria-labelledby', TAB_ID);
    return chip;
  }

  private handleSiteTab = (event: Event) => {
    const tab = (event.target as Element).closest('[role="tab"]');
    if (!tab || tab === this.chip || !this.tabActive) return;
    this.tabActive = false;
    this.uncover();
    this.update();
  };

  /** Shows the site's chosen tab as idle and hides its panel. */
  private cover(siteTabs: HTMLElement[], panel: HTMLElement) {
    this.uncover();
    const tab = siteTabs.find(
      (candidate) => candidate.getAttribute('aria-selected') === 'true',
    );
    if (!tab) return;
    this.covered = { tab, className: tab.className, panel };
    tab.className = this.chipClasses.idle;
    tab.setAttribute('aria-selected', 'false');
    panel.style.display = 'none';
  }

  private uncover() {
    if (!this.covered) return;
    const { tab, className, panel } = this.covered;
    this.covered = undefined;
    // React only rewrites these when the chosen tab changes.
    tab.className = className;
    tab.setAttribute('aria-selected', 'true');
    panel?.style.removeProperty('display');
  }

  private removeTab() {
    if (!this.chip) return;
    this.uncover();
    this.tabActive = false;
    this.tabList?.removeEventListener('click', this.handleSiteTab, true);
    this.tabList = undefined;
    this.chip.remove();
    this.chip = undefined;
    this.host.removeAttribute('id');
    this.host.removeAttribute('role');
    this.host.removeAttribute('aria-labelledby');
  }
}
