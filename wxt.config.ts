import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import Icons from 'unplugin-icons/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'wxt';

import { HIKKA_API_URL, HIKKA_MATCHES, HIKKA_URL } from './constants/hikka';
import {
  ANILIST_GRAPHQL_URL,
  BAKA_IN_UA_URL,
  MANGA_IN_UA_URL,
  TENRAI_API_URL,
} from './constants/links';

/** A host permission for every path under `url`'s origin. */
const originPattern = (url: string) => `${new URL(url).origin}/*`;

const env = loadEnv('', process.cwd(), '');
const isPersistent = env.WXT_PERSIST_BROWSER_DATA
  ? JSON.parse(env.WXT_PERSIST_BROWSER_DATA)
  : false;
const isWindows = process.platform === 'win32';
/** Production backend; a local one goes in .env (see .env.example). */
const CONVEX_URL = env.WXT_CONVEX_URL || 'https://convex.hikka-features.pp.ua';
const CONVEX_SITE_URL =
  env.WXT_CONVEX_SITE_URL || 'https://convex-site.hikka-features.pp.ua';
const convexUrls = [CONVEX_URL, CONVEX_SITE_URL];
const convexUrlsValid = convexUrls.every(
  (value) => !!value && URL.canParse(value),
);
/**
 * The backend's hosts, without ports: Firefox ignores host permissions that
 * name one (a local backend's), and the login's credentialed request then
 * fails CORS. A pattern without a port matches every port.
 */
const convexHostPermissions = [
  ...new Set(
    convexUrls.flatMap((value) => {
      if (!value) return [];
      try {
        const { protocol, hostname } = new URL(value);
        return [`${protocol}//${hostname}/*`];
      } catch {
        return [];
      }
    }),
  ),
];

export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  vite: () => ({
    plugins: [
      react({ compiler: true }),
      tailwindcss(),
      Icons({ compiler: 'jsx', jsx: 'react' }),
    ],
    define: {
      'import.meta.env.WXT_CONVEX_URL': JSON.stringify(CONVEX_URL),
      'import.meta.env.WXT_CONVEX_SITE_URL': JSON.stringify(CONVEX_SITE_URL),
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      entries: ['entrypoints/content/**/*.tsx'],
      include: ['react', 'react-dom'],
    },
  }),
  manifest: ({ mode }) => {
    // Without them every account and player call fails; .env isn't in git.
    if (
      mode === 'production' &&
      !process.argv.includes('prepare') &&
      !convexUrlsValid
    ) {
      throw new Error(
        'Set WXT_CONVEX_URL and WXT_CONVEX_SITE_URL (see .env.example)',
      );
    }
    return {
      name: 'Hikka Features',
      permissions: ['storage', 'alarms'],
      host_permissions: [
        originPattern(HIKKA_API_URL),
        ...convexHostPermissions,
        ...[
          ANILIST_GRAPHQL_URL,
          TENRAI_API_URL,
          MANGA_IN_UA_URL,
          BAKA_IN_UA_URL,
        ].map(originPattern),
      ],
      web_accessible_resources: [
        {
          // Injected into hikka.io's own world for its router.
          matches: HIKKA_MATCHES,
          resources: ['hikka-router.js', 'hf-x-cpr.svg', 'hf-x-cpr-dark.svg'],
        },
      ],
      browser_specific_settings: {
        gecko: {
          id: 'extension@hikka-features.pp.ua',
          data_collection_permissions: {
            required: ['none'],
          },
        },
      },
    };
  },
  webExt: {
    startUrls: [HIKKA_URL],
    chromiumArgs:
      !isWindows && isPersistent ? ['--user-data-dir=./.wxt/chrome-data'] : [],
    chromiumProfile: isWindows && isPersistent && resolve('.wxt/chrome-data'),
    keepProfileChanges: isWindows && isPersistent,
  },
  autoIcons: {
    developmentIndicator: 'overlay',
  },
});
