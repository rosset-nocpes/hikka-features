export const getLocalMALId = () =>
  parseInt(
    (document.head.querySelector('[name=mal-id][content]') as HTMLMetaElement)
      ?.content,
  );

export const getThemeVariables = () => {
  const variables: Record<string, string> = {};
  const styleSheets = document.head.querySelectorAll(
    'style, link[rel="stylesheet"]',
  );

  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const themeSelector = `.${theme}`;

  for (const sheet of styleSheets) {
    const cssRules =
      sheet instanceof HTMLStyleElement ? sheet.sheet?.cssRules : null;

    if (!cssRules) continue;

    for (const rule of cssRules) {
      if (rule instanceof CSSStyleRule) {
        const isThemeMatch =
          rule.selectorText === themeSelector ||
          rule.selectorText === ':root' ||
          rule.selectorText.includes(themeSelector);

        if (isThemeMatch) {
          const style = rule.style;
          for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            if (prop.startsWith('--')) {
              variables[prop] = style.getPropertyValue(prop).trim();
            }
          }
        }
      }
    }
  }

  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
};
