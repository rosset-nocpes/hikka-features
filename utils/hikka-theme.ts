/** hikka.io writes whole colours; older themes wrote bare `h s% l%`. */
const asColor = (value: string): string =>
  /^[\d.]+(deg)?[\s,]+[\d.]+%[\s,]+[\d.]+%$/.test(value)
    ? `hsl(${value})`
    : value;

/**
 * What every follower takes from the user's theme, even one that keeps the
 * extension's colours: its corners, which the user may square off, and its
 * accent.
 */
const SHARED = new Set(['--radius', '--primary']);

interface Follower {
  /** Takes all the user's colours, not only dark mode and the shared ones. */
  themeVariables: boolean;
  /** The variables set on it, so ones the user resets can be removed. */
  applied: Set<string>;
}

/**
 * hikka.io's theme, followed into every feature's container: dark mode, the
 * corners and accent and, where wanted, the other colours of the user's
 * theme. One observer serves all.
 */
class HikkaTheme {
  private readonly followers = new Map<HTMLElement, Follower>();
  private observer?: MutationObserver;

  get isDark(): boolean {
    return (
      document.documentElement.classList.contains('dark') ||
      getComputedStyle(document.documentElement).colorScheme === 'dark'
    );
  }

  /** Themes `container` like the page until it leaves the document. */
  follow(container: HTMLElement, { themeVariables = false } = {}) {
    const follower = { themeVariables, applied: new Set<string>() };
    this.followers.set(container, follower);
    this.observe();
    this.apply(container, follower, this.variables());
  }

  private observe() {
    if (this.observer) return;
    this.observer = new MutationObserver(this.update);
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    // hikka.io rewrites #user-styles when the user's theme loads or they
    // edit it.
    this.observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  private update = () => {
    let variables: Map<string, string> | undefined;
    for (const [container, follower] of this.followers) {
      if (!container.isConnected) {
        this.followers.delete(container);
        continue;
      }
      variables ??= this.variables();
      this.apply(container, follower, variables);
    }

    if (this.followers.size === 0) {
      this.observer?.disconnect();
      this.observer = undefined;
    }
  };

  private apply(
    container: HTMLElement,
    follower: Follower,
    variables: Map<string, string>,
  ) {
    const taken = follower.themeVariables
      ? variables
      : new Map([...variables].filter(([name]) => SHARED.has(name)));
    // A variable the user reset falls back to the extension's own.
    for (const name of follower.applied) {
      if (!taken.has(name)) container.style.removeProperty(name);
    }
    for (const [name, value] of taken) {
      container.style.setProperty(name, value);
    }
    follower.applied = new Set(taken.keys());
    container.classList.toggle('dark', this.isDark);
  }

  /** The user's hikka.io theme, by custom property. */
  private variables() {
    const variables = new Map<string, string>();
    const userStyles = document.getElementById(
      'user-styles',
    ) as HTMLStyleElement | null;
    if (!userStyles?.sheet) return variables;

    const isDark = document.documentElement.classList.contains('dark');

    try {
      const rules = Array.from(userStyles.sheet.cssRules);

      const extract = (selector: string): void => {
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

      extract(':root');
      extract(':root:root');
      extract('.dark');
      if (isDark) extract('.dark.dark');

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
  }
}

export const hikkaTheme = new HikkaTheme();
