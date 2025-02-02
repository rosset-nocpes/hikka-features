import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    build: {
      target: 'esnext',
      // minify: 'esbuild',
    },
    plugins: [Icons({ compiler: 'jsx', jsx: 'react' })],
    optimizeDeps: {
      entries: ['src/**/*.{ts,tsx}'],
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
  },
});
