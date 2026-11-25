import {
  HYDRATED_ATTRIBUTE,
  HYDRATION_TIMEOUT_MS,
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

/** How often to look whether the site has hydrated. */
const HYDRATION_POLL_MS = 25;
/** How long after the page has loaded React may take to show up at all. */
const REACT_ROOT_GRACE_MS = 2_000;

/**
 * Whether React has hydrated the site's server HTML: the root, and every
 * Suspense boundary (route content streams in behind them). Read from
 * React's internals, which only this world sees; undefined once they don't
 * look as expected, so the caller stops waiting.
 */
function hydrationPending(loadedFor: number): boolean | undefined {
  const key = Object.keys(document).find((name) =>
    name.startsWith('__reactContainer$'),
  );
  // React mounts from a module script; well after the page has loaded, it isn't coming.
  if (!key) return loadedFor < REACT_ROOT_GRACE_MS ? true : undefined;
  type Fiber = {
    child?: Fiber | null;
    sibling?: Fiber | null;
    memoizedState?: { isDehydrated?: boolean; dehydrated?: unknown } | null;
  };
  const current = (
    document as unknown as Record<string, { stateNode?: { current?: Fiber } }>
  )[key]?.stateNode?.current;
  const isDehydrated = current?.memoizedState?.isDehydrated;
  if (!current || typeof isDehydrated !== 'boolean') return undefined;
  if (isDehydrated) return true;
  const stack: Fiber[] = [current];
  while (stack.length) {
    const fiber = stack.pop()!;
    // A dehydrated Suspense boundary keeps its server HTML's comment node here.
    if (fiber.memoizedState?.dehydrated instanceof Node) return true;
    if (fiber.sibling) stack.push(fiber.sibling);
    if (fiber.child) stack.push(fiber.child);
  }
  return false;
}

/** Marks `<html>` once the site has hydrated, or after a while regardless. */
function markHydrated(root: HTMLElement) {
  const started = Date.now();
  let loadedAt: number | undefined;
  const check = () => {
    const now = Date.now();
    if (document.readyState === 'complete') loadedAt ??= now;
    if (
      hydrationPending(loadedAt === undefined ? 0 : now - loadedAt) === true &&
      now - started < HYDRATION_TIMEOUT_MS
    ) {
      setTimeout(check, HYDRATION_POLL_MS);
      return;
    }
    root.setAttribute(HYDRATED_ATTRIBUTE, '');
  };
  check();
}

/**
 * Runs in hikka.io's own JavaScript world, injected by the content script.
 * hikka.io answers paths it doesn't know, like the extension's pages, with a
 * bare 404 page. Its router can show another route under any URL (route
 * masking), so each of them shows one of the site's (`ownPageRoute`), with
 * the site's navbar and footer, which the content script then fills in.
 */
export default defineUnlistedScript(async () => {
  const root = document.documentElement;
  markHydrated(root);
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
