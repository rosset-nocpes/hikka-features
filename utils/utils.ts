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
            variables.set(prop, rule.style.getPropertyValue(prop).trim()),
          );
      }
    };

    extractVariables(':root');
    if (isDark) extractVariables('.dark');

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
