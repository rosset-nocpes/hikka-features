import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import Icons from 'unplugin-icons/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'wxt';

const env = loadEnv('', process.cwd(), '');
const isPersistent = env.WXT_PERSIST_BROWSER_DATA
  ? JSON.parse(env.WXT_PERSIST_BROWSER_DATA)
  : false;
const isWindows = process.platform === 'win32';
const convexHostPermissions = [
  env.WXT_CONVEX_URL,
  env.WXT_CONVEX_SITE_URL,
].flatMap((value) => {
  if (!value) return [];
  try {
    return [`${new URL(value).origin}/*`];
  } catch {
    return [];
  }
});

export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  vite: () => ({
    plugins: [
      react({ compiler: true }),
      tailwindcss(),
      Icons({ compiler: 'jsx', jsx: 'react' }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      entries: ['entrypoints/content/**/*.tsx'],
      include: ['react', 'react-dom'],
    },
  }),
  manifest: () => ({
    name: 'Hikka Features',
    permissions: ['storage', 'identity', 'alarms', 'notifications'],
    host_permissions: [
      'https://*.hikka.io/*',
      'https://*.hikka-features.pp.ua/*',
      'https://*.convex.cloud/*',
      'https://*.convex.site/*',
      ...convexHostPermissions,
      'https://graphql.anilist.co/*',
      'https://api.tenrai.org/*',
      'https://manga.in.ua/*',
      'https://baka.in.ua/*',
    ],
    browser_specific_settings: {
      gecko: {
        id: 'extension@hikka-features.pp.ua',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  }),
  webExt: {
    startUrls: ['https://hikka.io'],
    chromiumArgs:
      !isWindows && isPersistent ? ['--user-data-dir=./.wxt/chrome-data'] : [],
    chromiumProfile: isWindows && isPersistent && resolve('.wxt/chrome-data'),
    keepProfileChanges: isWindows && isPersistent,
  },
  autoIcons: {
    developmentIndicator: 'overlay',
  },
});
