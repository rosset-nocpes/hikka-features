import { queryOptions } from '@tanstack/react-query';

import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';
import { TEAM_PAGE_PATH } from '@/utils/hikka-router';

import { queryClient } from '../../core/query-client';

/** How long a link has to be pointed at before its team page is fetched. */
const HOVER_MS = 80;

export const teamPageQuery = (slug: string) =>
  queryOptions({
    queryKey: ['team-page', slug],
    queryFn: () => convex.query(convexApi.fandub.team, { slug }),
    staleTime: 60_000,
    retry: false,
  });

/** Starts loading the team page at `path`, if it is one. */
export function prefetchTeamPage(path: string) {
  const slug = path.match(TEAM_PAGE_PATH)?.[1];
  if (!slug) return;
  void queryClient.prefetchQuery(teamPageQuery(decodeURIComponent(slug)));
}

/** The path of the hikka.io link an event happened on, in any shadow root. */
const linkPath = (event: Event) => {
  for (const target of event.composedPath()) {
    if (target instanceof HTMLAnchorElement) {
      return target.origin === location.origin ? target.pathname : undefined;
    }
  }
  return undefined;
};

/**
 * Fetches a team's page while its link is pointed at or focused, so it's
 * mostly there by the click: teams' links are on many of the site's pages
 * and the extension's own.
 */
export function prefetchTeamPagesOnIntent() {
  let timer = 0;
  const onPointerOver = (event: Event) => {
    clearTimeout(timer);
    const path = linkPath(event);
    if (path) timer = window.setTimeout(prefetchTeamPage, HOVER_MS, path);
  };
  const onFocusIn = (event: Event) => {
    const path = linkPath(event);
    if (path) prefetchTeamPage(path);
  };
  document.addEventListener('pointerover', onPointerOver, { passive: true });
  document.addEventListener('focusin', onFocusIn);
  return () => {
    clearTimeout(timer);
    document.removeEventListener('pointerover', onPointerOver);
    document.removeEventListener('focusin', onFocusIn);
  };
}
