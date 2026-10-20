/** A Hikka title's name to show: Ukrainian first. */
export const hikkaTitle = (content: any): string | undefined =>
  content?.title_ua ||
  content?.title_en ||
  content?.title_ja ||
  content?.title_original;

/** A name without case and spaces, for matching and searching names. */
export const looseKey = (value: string) =>
  value.toLocaleLowerCase('uk').replace(/\s+/g, '');

/** The colours of the user's hikka.io theme, by custom property. */
const getThemeVariables = () => {
  const variables = new Map<string, string>();
  const userStyles = document.getElementById('user-styles') as HTMLStyleElement;
  if (!userStyles?.sheet) return variables;

  const isDark = document.documentElement.classList.contains('dark');

  // hikka.io writes whole colours, as the extension's tokens are; older
  // themes wrote bare `h s% l%` triplets.
  const asColor = (value: string): string =>
    /^[\d.]+(deg)?[\s,]+[\d.]+%[\s,]+[\d.]+%$/.test(value)
      ? `hsl(${value})`
      : value;

  try {
    const rules = Array.from(userStyles.sheet.cssRules);

    const extractVariables = (selector: string): void => {
      const rule = rules.find(
        (rule): rule is CSSStyleRule =>
          rule instanceof CSSStyleRule && rule.selectorText === selector,
      );
      if (!rule) return;
      for (const prop of Array.from(rule.style)) {
        if (prop.startsWith('--')) {
          variables.set(
            prop,
            asColor(rule.style.getPropertyValue(prop).trim()),
          );
        }
      }
    };

    extractVariables(':root');
    extractVariables(':root:root');
    extractVariables('.dark');
    if (isDark) extractVariables('.dark.dark');

    // The site derives its accent from the user's brand colour; so does the
    // extension's primary, at the lightness the site gives accent text.
    const brand = variables.get('--brand');
    if (brand) {
      variables.set(
        '--primary',
        `oklch(from ${brand} ${isDark ? 0.722 : 0.5} c h)`,
      );
    }
  } catch (error) {
    console.warn(
      '[hikka Features] Failed to read CSS rules from #user-styles:',
      error,
    );
    variables.clear();
  }
  return variables;
};

export const isHikkaDarkMode = (): boolean =>
  document.documentElement.classList.contains('dark') ||
  getComputedStyle(document.documentElement).colorScheme === 'dark';

/** Follows hikka.io's dark mode and, with `themeVariables`, its colours. */
export const syncFeatureTheme = (
  container: HTMLElement,
  options: { themeVariables?: boolean } = {},
): void => {
  let applied = new Set<string>();

  const applyThemeVariables = () => {
    const variables = getThemeVariables();

    // A colour the user reset falls back to the extension's own.
    for (const name of applied) {
      if (!variables.has(name)) container.style.removeProperty(name);
    }
    for (const [name, value] of variables) {
      container.style.setProperty(name, value);
    }
    applied = new Set(variables.keys());
  };

  const applyTheme = () => {
    if (!container.isConnected) return observer.disconnect();
    if (options.themeVariables) applyThemeVariables();
    container.classList.toggle('dark', isHikkaDarkMode());
  };

  const observer = new MutationObserver(applyTheme);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style'],
  });
  if (options.themeVariables) {
    // hikka.io rewrites #user-styles when the user's theme loads or they
    // edit it.
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  applyTheme();
};
