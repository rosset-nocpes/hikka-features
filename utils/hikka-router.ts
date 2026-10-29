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

/** `/<type>/<slug>/recommendations`, the titles MAL users liked with one. */
export const RECOMMENDATIONS_PAGE_PATH =
  /^\/(anime|manga|novel)\/([^/]+)\/recommendations\/?$/;

export const isRecommendationsPagePath = (path: string) =>
  RECOMMENDATIONS_PAGE_PATH.test(path);

export const recommendationsPagePath = (contentType: string, slug: string) =>
  `/${contentType}/${slug}/recommendations`;

/**
 * The route of hikka.io's that one of the extension's pages is shown over,
 * or nothing for the site's own paths: the home page under team pages, and
 * a title's authors, a tab every title has, under its recommendations.
 */
export function ownPageRoute(path: string) {
  if (isTeamPagePath(path)) return '/';
  const recommendations = path.match(RECOMMENDATIONS_PAGE_PATH);
  return recommendations
    ? `/${recommendations[1]}/${recommendations[2]}/staff`
    : undefined;
}

/** Asks the router to open a path; `detail` is `{ href, replace }` as JSON. */
export const NAVIGATE_EVENT = 'hikka-features:navigate';
/** The router finished opening a path, the site's own links included. */
export const NAVIGATED_EVENT = 'hikka-features:navigated';
/** Set on `<html>` once the router answers navigation requests. */
export const ROUTER_READY_ATTRIBUTE = 'data-hikka-features-router';
/** Set on `<html>` once a page of the extension's loaded directly is in the site's layout. */
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

/** On the site's content while one of the extension's pages covers it. */
const COVERED_ATTRIBUTE = 'data-hikka-features-covered';

/** Hides what `coverSiteContent` marks. */
export const COVERED_STYLE = `[${COVERED_ATTRIBUTE}] { display: none !important; }`;

/**
 * Hides the site's content beside `ui`, one of the extension's pages, in
 * their container: what is there, and what the site adds while `isPage`
 * holds for the URL. The route opened next renders after the URL changes,
 * so it is never hidden, not even for the moment before the page goes: some
 * of its parts measure themselves once, and measured hidden, they stay
 * broken (base-ui's sliders lose their thumbs). Returns what shows it again.
 */
export function coverSiteContent(
  ui: Element,
  isPage: (path: string) => boolean,
) {
  const container = ui.parentElement;
  if (!container) return () => {};
  const cover = () => {
    if (!isPage(location.pathname)) return;
    for (const child of container.children) {
      if (child !== ui) child.setAttribute(COVERED_ATTRIBUTE, '');
    }
  };
  cover();
  const observer = new MutationObserver(cover);
  observer.observe(container, { childList: true });
  return () => {
    observer.disconnect();
    for (const child of container.children) {
      child.removeAttribute(COVERED_ATTRIBUTE);
    }
  };
}
