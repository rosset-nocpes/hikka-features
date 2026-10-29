import './style.css';

const HOSTS = ['hikka.io', 'dev.hikka.io'];
const PATHS = [
  '/teams*',
  '/anime/*/recommendations*',
  '/manga/*/recommendations*',
  '/novel/*/recommendations*',
];

/**
 * The extension's pages loaded directly come as hikka.io's 404 page until
 * the router shows them in the site's layout (see
 * `entrypoints/hikka-router.ts`); this keeps that page from flashing.
 */
export default defineContentScript({
  matches: HOSTS.flatMap((host) =>
    PATHS.map((path) => `https://${host}${path}`),
  ),
  runAt: 'document_start',
  main() {},
});
