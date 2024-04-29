import { defineExternal, definePlugins } from '@gera2ld/plaid-rollup';
import { defineConfig } from 'rollup';
import userscript from 'rollup-plugin-userscript';
import pkg from './package.json' assert { type: 'json' };

export default defineConfig(
  Object.entries({
    'hikka-features': 'src/main-script/index.ts',
  }).map(([name, entry]) => ({
    input: entry,
    plugins: [
      ...definePlugins({
        esm: true,
        minimize: false,
        postcss: {
          inject: false,
          minimize: true,
        },
        extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx'],
      }),
      userscript((meta) =>
        meta
          .replace('process.env.AUTHOR', pkg.author)
          .replace('process.env.VERSION', pkg.version)
          .replace('process.env.DESCRIPTION', pkg.description),
      ),
    ],
    external: defineExternal([
      '@violentmonkey/url',
      '@violentmonkey/dom',
      'solid-js',
      'solid-js/web',
    ]),
    output: {
      format: 'iife',
      file: `dist/${name}.user.js`,
      globals: {
        // Note:
        // - VM.solid is just a third-party UMD bundle for solid-js since there is no official one
        // - If you don't want to use it, just remove `solid-js` related packages from `external`, `globals` and the `meta.js` file.
        'solid-js': 'VM.solid',
        'solid-js/web': 'VM.solid.web',
        '@violentmonkey/dom': 'VM',
        '@violentmonkey/url': 'VM',
      },
      indent: false,
    },
  })),
);
