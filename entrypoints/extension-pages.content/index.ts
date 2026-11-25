import './style.css';
import { HIKKA_ORIGINS } from '@/constants/hikka';

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
  matches: HIKKA_ORIGINS.flatMap((origin) =>
    PATHS.map((path) => `${origin}${path}`),
  ),
  runAt: 'document_start',
  main() {},
});
