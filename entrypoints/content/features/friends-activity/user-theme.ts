import { getThemeVariables, isHikkaDarkMode } from '@/utils/utils';

/** Tokens the extension's CSS reads as `hsl(var(--token))`. */
const COLOR_TOKENS = new Set([
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'border',
  'input',
  'ring',
]);

/** `h s% l%`, as hikka.io's earlier themes wrote colours. */
const isTriplet = (value: string) =>
  /^[\d.]+(deg)?[\s,]+[\d.]+%[\s,]+[\d.]+%$/.test(value);

/**
 * The extension's tokens for the user's hikka.io theme. hikka.io now writes
 * whole `oklch()` colours, which `hsl(var(--token))` can't take, so they go
 * in as relative colours (`hsl(from oklch(…) h s l)` is one). The brand
 * colour becomes the extension's primary, at the lightness the site gives
 * its own accent text.
 */
function themeTokens(dark: boolean) {
  const tokens = new Map<string, string>();
  for (const declaration of getThemeVariables().split(';')) {
    const separator = declaration.indexOf(':');
    if (separator === -1) continue;
    const name = declaration.slice(0, separator).trim();
    const value = declaration.slice(separator + 1).trim();
    const token = name.slice(2);

    if (token === 'brand') {
      tokens.set(
        '--primary',
        `from oklch(from ${value} ${dark ? 0.722 : 0.5} c h) h s l`,
      );
    } else if (COLOR_TOKENS.has(token) && !isTriplet(value)) {
      tokens.set(name, `from ${value} h s l`);
    } else {
      tokens.set(name, value);
    }
  }
  return tokens;
}

/**
 * Keeps `container` in the user's hikka.io theme: dark or light, and the
 * colours and corner radius they picked, as the site's own widgets show them.
 * Reads the same `#user-styles` as `syncFeatureTheme`'s theme variables.
 */
export function syncUserTheme(container: HTMLElement) {
  let applied = new Set<string>();

  const apply = () => {
    if (!container.isConnected) return observer.disconnect();
    const dark = isHikkaDarkMode();
    container.classList.toggle('dark', dark);

    const tokens = themeTokens(dark);
    // A colour the user reset falls back to the extension's own.
    for (const name of applied) {
      if (!tokens.has(name)) container.style.removeProperty(name);
    }
    for (const [name, value] of tokens) {
      container.style.setProperty(name, value);
    }
    applied = new Set(tokens.keys());
  };

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style'],
  });
  // The theme editor rewrites the style tag as the user picks colours.
  observer.observe(document.head, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  apply();
}
