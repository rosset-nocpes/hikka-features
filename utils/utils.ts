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

  const unwrapHsl = (value: string): string => {
    const match = value.match(/hsl\((.*)\)/i);
    return match ? match[1].trim() : value;
  };

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
              unwrapHsl(rule.style.getPropertyValue(prop).trim()),
            ),
          );
      }
    };

    extractVariables(':root');
    extractVariables(':root:root');
    extractVariables('.dark');
    if (isDark) extractVariables('.dark.dark');

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
  const applyThemeVariables = () => {
    for (const declaration of getThemeVariables().split(';')) {
      const separatorIndex = declaration.indexOf(':');
      if (separatorIndex === -1) continue;

      container.style.setProperty(
        declaration.slice(0, separatorIndex).trim(),
        declaration.slice(separatorIndex + 1).trim(),
      );
    }
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

  applyTheme();
};
