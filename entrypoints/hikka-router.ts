import {
  NAVIGATE_EVENT,
  NAVIGATED_EVENT,
  ownPageRoute,
  PAGE_READY_ATTRIBUTE,
  ROUTER_READY_ATTRIBUTE,
} from '@/utils/hikka-router';

/** The parts of hikka.io's TanStack router this script uses. */
interface Router {
  navigate: (options: Record<string, unknown>) => Promise<void>;
  subscribe: (event: 'onResolved', listener: () => void) => () => void;
}

/** How long to wait for the site to start its router. */
const ROUTER_TIMEOUT_MS = 5_000;

const findRouter = async () => {
  for (let waited = 0; waited < ROUTER_TIMEOUT_MS; waited += 100) {
    const router = (window as { __TSR_ROUTER__?: Router }).__TSR_ROUTER__;
    if (router) return router;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return undefined;
};

/**
 * Runs in hikka.io's own JavaScript world, injected by the content script.
 * hikka.io answers paths it doesn't know, like the extension's pages, with a
 * bare 404 page. Its router can show another route under any URL (route
 * masking), so each of them shows one of the site's (`ownPageRoute`), with
 * the site's navbar and footer, which the content script then fills in.
 */
export default defineUnlistedScript(async () => {
  const root = document.documentElement;
  const router = await findRouter();
  if (!router) {
    root.setAttribute(PAGE_READY_ATTRIBUTE, '');
    return;
  }

  const navigate = (href: string, replace: boolean) => {
    const url = new URL(href, location.origin);
    const path = url.pathname + url.search;
    const route = ownPageRoute(url.pathname);
    return route
      ? router.navigate({
          to: route,
          replace,
          // Every team page is the same route underneath, and a title's
          // recommendations are its authors' route; the router skips a
          // navigation that changes only the mask, so the state differs.
          state: { hikkaFeaturesPage: path },
          // Reloads ask the server for the masked path, which this answers again.
          mask: { to: path, unmaskOnReload: false },
        })
      : router.navigate({ href: path + url.hash, replace });
  };

  document.addEventListener(NAVIGATE_EVENT, (event) => {
    const { detail } = event as CustomEvent<unknown>;
    if (typeof detail !== 'string') return;
    const { href, replace } = JSON.parse(detail) as {
      href: string;
      replace?: boolean;
    };
    void navigate(href, !!replace).catch(() => location.assign(href));
  });
  router.subscribe('onResolved', () =>
    document.dispatchEvent(new Event(NAVIGATED_EVENT)),
  );
  root.setAttribute(ROUTER_READY_ATTRIBUTE, '');

  // A page of the extension's opened directly: the server sent its 404 page.
  if (ownPageRoute(location.pathname) && !document.querySelector('main')) {
    await navigate(location.pathname + location.search, true).catch(
      () => undefined,
    );
  }
  root.setAttribute(PAGE_READY_ATTRIBUTE, '');
});
