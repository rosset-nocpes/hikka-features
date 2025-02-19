import { resolve } from 'node:path';
import Icons from 'unplugin-icons/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'wxt';

const env = loadEnv('', process.cwd(), '');
const isPersistent = JSON.parse(env.WXT_PERSIST_BROWSER_DATA);
const isWindows = process.platform === 'win32';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [Icons({ compiler: 'jsx', jsx: 'react' })],
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
  runner: {
    startUrls: ['https://hikka.io'],
    chromiumArgs:
      !isWindows && isPersistent ? ['--user-data-dir=./.wxt/chrome-data'] : [],
    chromiumProfile: isWindows && isPersistent && resolve('.wxt/chrome-data'),
    keepProfileChanges: isWindows && isPersistent,
  },
});
