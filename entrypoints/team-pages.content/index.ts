import './style.css';

/**
 * Team pages loaded directly come as hikka.io's 404 page until the router
 * shows them in the site's layout (see `entrypoints/hikka-router.ts`); this
 * keeps that page from flashing.
 */
export default defineContentScript({
  matches: ['https://hikka.io/teams*', 'https://dev.hikka.io/teams*'],
  runAt: 'document_start',
  main() {},
});
