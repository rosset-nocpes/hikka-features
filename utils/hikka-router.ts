import type { MouseEvent } from 'react';

/**
 * The extension's own pages on hikka.io and navigation through the site's
 * router, which lives in the page's JavaScript world (see
 * `entrypoints/hikka-router.ts`). The two worlds share only the DOM, so they
 * talk through events on `document`.
 */

/** `/teams`, the list of teams, and `/teams/<slug>`, a team's page. */
export const TEAM_PAGE_PATH = /^\/teams(?:\/([^/]+))?\/?$/;

export const isTeamPagePath = (path: string) => TEAM_PAGE_PATH.test(path);

export const teamPagePath = (slug?: string) =>
  slug ? `/teams/${encodeURIComponent(slug)}` : '/teams';

/** Asks the router to open a path; `detail` is `{ href, replace }` as JSON. */
export const NAVIGATE_EVENT = 'hikka-features:navigate';
/** The router finished opening a path, the site's own links included. */
export const NAVIGATED_EVENT = 'hikka-features:navigated';
/** Set on `<html>` once the router answers navigation requests. */
export const ROUTER_READY_ATTRIBUTE = 'data-hikka-features-router';
/** Set on `<html>` once a team page loaded directly is in the site's layout. */
export const PAGE_READY_ATTRIBUTE = 'data-hikka-features-ready';

/** Opens a hikka.io path in place, or loads it when the router can't. */
export function navigateOnHikka(href: string, { replace = false } = {}) {
  if (!document.documentElement.hasAttribute(ROUTER_READY_ATTRIBUTE)) {
    location.assign(href);
    return;
  }
  document.dispatchEvent(
    new CustomEvent(NAVIGATE_EVENT, {
      detail: JSON.stringify({ href, replace }),
    }),
  );
}

/** For links to hikka.io paths: plain clicks open them in place. */
export function onHikkaLinkClick(event: MouseEvent<HTMLAnchorElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  const href = event.currentTarget.getAttribute('href');
  if (!href) return;
  event.preventDefault();
  navigateOnHikka(href);
}

/** Calls `listener` whenever the site's URL changes. */
export function onHikkaNavigation(listener: () => void) {
  document.addEventListener(NAVIGATED_EVENT, listener);
  window.addEventListener('popstate', listener);
  return () => {
    document.removeEventListener(NAVIGATED_EVENT, listener);
    window.removeEventListener('popstate', listener);
  };
}
