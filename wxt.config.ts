import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import Icons from 'unplugin-icons/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'wxt';

const env = loadEnv('', process.cwd(), '');
const isPersistent = env.WXT_PERSIST_BROWSER_DATA
  ? JSON.parse(env.WXT_PERSIST_BROWSER_DATA)
  : false;
const isWindows = process.platform === 'win32';

export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  vite: () => ({
    plugins: [react(), Icons({ compiler: 'jsx', jsx: 'react' })],
    optimizeDeps: {
      entries: ['entrypoints/content/**/*.tsx'],
      include: ['react', 'react-dom'],
    },
  }),
  manifest: () => ({
    name: 'Hikka Features',
    permissions: ['webNavigation', 'storage', 'identity'],
    host_permissions: [
      'https://*.hikka.io/*',
      'https://*.hikka-features.pp.ua/*',
      'https://corsproxy.io/*',
      'https://graphql.anilist.co/*',
    ],
    browser_specific_settings: {
      gecko: {
        id: 'extension@hikka-features.pp.ua',
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
