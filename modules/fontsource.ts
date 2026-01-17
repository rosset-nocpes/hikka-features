import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { addAlias, addPublicAssets, defineWxtModule } from 'wxt/modules';

const require = createRequire(import.meta.url);

const getFontsourcePackages = (rootDir: string): string[] => {
  const pkgPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  return Object.keys(deps).filter(name => 
    name.startsWith('@fontsource/') || name.startsWith('@fontsource-variable/')
  );
};

export default defineWxtModule({
  name: 'fontsource-shadow-root',
  imports: [{ from: '#fontsource', name: '*', as: 'Fonts' }],
  async setup(wxt) {
    const fonts = getFontsourcePackages(wxt.config.root);
    if (fonts.length === 0) return;

    const tempAssetsDir = path.resolve(wxt.config.wxtDir, 'fontsource-assets');
    const runtimePath = 'fontsource-runtime.ts';
    const absoluteRuntimePath = path.resolve(wxt.config.wxtDir, runtimePath);

    if (fs.existsSync(tempAssetsDir)) fs.rmSync(tempAssetsDir, { recursive: true });
    fs.mkdirSync(tempAssetsDir, { recursive: true });

    const fontCssMap: Record<string, string> = {};

    for (const pkgName of fonts) {
      try {
        const pkgPath = path.dirname(require.resolve(`${pkgName}/package.json`));
        const cssPath = path.join(pkgPath, 'index.css');
        let css = fs.readFileSync(cssPath, 'utf-8');

        const urlRegex = /url\(["']?(\.\/files\/[^"']+)["']?\)/g;
        const safePkgName = pkgName.replace(/[@/]/g, '-');
        const fontDestDir = path.join(tempAssetsDir, 'fonts', safePkgName);
        fs.mkdirSync(fontDestDir, { recursive: true });

        for (const match of css.matchAll(urlRegex)) {
          const relativePath = match[1];
          const fileName = path.basename(relativePath);
          fs.copyFileSync(path.join(pkgPath, relativePath), path.join(fontDestDir, fileName));
          css = css.replace(relativePath, `__WXT_FONT_URL__fonts/${safePkgName}/${fileName}__`);
        }
        fontCssMap[pkgName] = css;
      } catch (err) {
        wxt.logger.error(`Fontsource: Failed to process ${pkgName}`, err);
      }
    }

    addPublicAssets(wxt, tempAssetsDir);
    addAlias(wxt, '#fontsource', absoluteRuntimePath);

    const cssExports = Object.entries(fontCssMap)
      .map(([name, css]) => {
        const varName = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const runtimeCss = JSON.stringify(css).replace(
          /__WXT_FONT_URL__(.*?)__/g,
          `" + browser.runtime.getURL("$1") + "`,
        );
        return `export const ${varName}_CSS = ${runtimeCss};`;
      })
      .join('\n');

    const allFontsArray = Object.entries(fontCssMap)
      .map(([name]) => {
        const varName = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        return `${varName}_CSS`;
      })
      .join(', ');

    const runtimeCode = `
import { browser } from 'wxt/browser';

${cssExports}

export function injectFontToDocument(cssString: string) {
  const existing = Array.from(document.querySelectorAll('style')).find(
    style => style.textContent === cssString
  );
  if (existing) return;
  const style = document.createElement('style');
  style.textContent = cssString;
  document.head.appendChild(style);
}

export function injectAllFonts() {
  [${allFontsArray}].forEach(injectFontToDocument);
}
    `.trim();

    wxt.hook('prepare:types', (_, entries) => {
      entries.push({ path: runtimePath, text: runtimeCode, tsReference: true });
    });

    wxt.hook('build:manifestGenerated', (_, manifest) => {
      if (manifest.manifest_version === 2) {
        manifest.web_accessible_resources ??= [];
        manifest.web_accessible_resources.push('fonts/**/*');
      } else {
        manifest.web_accessible_resources ??= [];
        manifest.web_accessible_resources.push({
          matches: ['<all_urls>'],
          resources: ['fonts/**/*'],
        });
      }
    });
  },
});
