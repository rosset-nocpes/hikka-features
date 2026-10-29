import type { MouseEvent } from 'react';

import { onHikkaLinkClick } from '@/utils/hikka-router';

/**
 * hikka.io's own class strings for links the extension adds to its
 * navigation, which live in the site's DOM and so take its styles.
 */

/** A tab under a title's header (`chip-tabs.tsx`). */
export const TAB =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring border px-3.5 text-sm';
export const TAB_IDLE =
  'border-transparent bg-secondary/40 text-muted-foreground hover:bg-accent';
export const TAB_ACTIVE =
  'border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground';

/** A row in the mobile drawers, "Ще" and a page's sections (`nav-styles.ts`). */
export const DRAWER_ROW =
  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors text-muted-foreground hover:bg-accent hover:text-foreground data-[active=true]:bg-primary-foreground/15 data-[active=true]:font-medium data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary-foreground/20 data-[active=true]:hover:text-primary-foreground [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0';

/** Opens a drawer row's path and closes the drawer, on Escape, as hikka.io's rows do. */
export function onDrawerLinkClick(event: MouseEvent<HTMLAnchorElement>) {
  onHikkaLinkClick(event);
  event.currentTarget.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
}
