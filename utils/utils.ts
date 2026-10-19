export const getLocalMALId = () =>
  parseInt(
    (document.head.querySelector('[name=mal-id][content]') as HTMLMetaElement)
      ?.content,
  );

export const getThemeVariables = (): string => {
  const userStyles = document.getElementById('user-styles') as HTMLStyleElement;
  if (!userStyles?.sheet) return '';

  const isDark = document.documentElement.classList.contains('dark');
  const variables = new Map<string, string>();

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

      if (rule) {
        Array.from(rule.style)
          .filter((prop) => prop.startsWith('--'))
          .map((prop) =>
            variables.set(
              prop,
              asColor(rule.style.getPropertyValue(prop).trim()),
            ),
          );
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

    return Array.from(variables.entries())
      .map(([key, value]) => `${key}: ${value};`)
      .join(' ');
  } catch (error) {
    console.warn(
      '[hikka Features] Failed to read CSS rules from #user-styles:',
      error,
    );
    return '';
  }
};

export const isHikkaDarkMode = (): boolean =>
  document.documentElement.classList.contains('dark') ||
  getComputedStyle(document.documentElement).colorScheme === 'dark';

export const syncFeatureTheme = (
  container: HTMLElement,
  options: { themeVariables?: boolean } = {},
): void => {
  let applied = new Set<string>();

  const applyThemeVariables = () => {
    const variables = new Map<string, string>();
    for (const declaration of getThemeVariables().split(';')) {
      const separatorIndex = declaration.indexOf(':');
      if (separatorIndex === -1) continue;
      variables.set(
        declaration.slice(0, separatorIndex).trim(),
        declaration.slice(separatorIndex + 1).trim(),
      );
    }

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

    if (options.themeVariables) {
      applyThemeVariables();
    }

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
