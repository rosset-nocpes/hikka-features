import { useEffect, useRef } from 'react';

import {
  DrawerLink,
  TAB,
  TAB_ACTIVE,
  TAB_IDLE,
} from '@/components/hikka/nav-links';
import { RECOMMENDATIONS_TAB } from '@/hooks/use-recommendation';
import {
  isRecommendationsPagePath,
  onHikkaLinkClick,
  recommendationsPagePath,
} from '@/utils/hikka-router';

import { AnchoredUisFeature, type SiteTarget } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

/** The anime, manga or novel that a title's tab, or its discussion, is about. */
const TITLE_PATH = /^\/(?:comments\/)?(anime|manga|novel)\/([^/]+)/;

/**
 * The discussion's link in a list of a title's sections, the last one: the
 * list is the one that also links the title's characters.
 */
const findDiscussion = (scope: string) => () =>
  [
    ...document.querySelectorAll<HTMLElement>(`${scope} a[href^="/comments/"]`),
  ].find((link) =>
    link.parentElement?.querySelector(':scope > a[href$="/characters"]'),
  );

/** Where the page is linked from, while the block is on, and whether it's open. */
const useRecommendationsLink = () => {
  const path = useLocationPath();
  const { enabled } = useSettings().features.recommendationBlock;
  const [, type, slug] = path.match(TITLE_PATH) ?? [];
  return {
    href:
      enabled && type && slug ? recommendationsPagePath(type, slug) : undefined,
    active: isRecommendationsPagePath(path),
  };
};

const Tab = () => {
  const { href, active } = useRecommendationsLink();
  const ref = useRef<HTMLAnchorElement>(null);

  // As hikka.io's tabs do, the row scrolls sideways to show the current one.
  useEffect(() => {
    const tab = ref.current;
    const row = tab?.closest<HTMLElement>('.overflow-x-auto');
    if (!active || !tab || !row) return;
    const hidden =
      tab.getBoundingClientRect().right - row.getBoundingClientRect().right;
    if (hidden > 0) row.scrollLeft += hidden;
  }, [active]);

  if (!href) return null;
  return (
    <a
      ref={ref}
      href={href}
      onClick={onHikkaLinkClick}
      aria-current={active ? 'page' : undefined}
      className={`${TAB} ${active ? TAB_ACTIVE : TAB_IDLE}`}
    >
      {RECOMMENDATIONS_TAB}
    </a>
  );
};

const DrawerRow = () => {
  const { href, active } = useRecommendationsLink();
  if (!href) return null;
  return (
    <DrawerLink href={href} active={active}>
      <span>{RECOMMENDATIONS_TAB}</span>
    </DrawerLink>
  );
};

const TARGETS: SiteTarget[] = [
  {
    find: findDiscussion('main section[data-slot="block-surface"]'),
    append: 'before',
    render: () => <Tab />,
  },
  {
    find: findDiscussion('[data-slot="drawer-content"]'),
    append: 'before',
    render: () => <DrawerRow />,
  },
];

/**
 * "Схожі", the recommendations page, among a title's sections:
 * before "Обговорення" in the tabs under its header, and in the drawer of
 * sections from the mobile top bar, which is only on the page while open.
 * Both go into hikka.io's own DOM for its styles.
 */
export default class RecommendationNavLinkFeature extends AnchoredUisFeature {
  readonly id = 'recommendation-nav-link';
  readonly pages = [HikkaPages.All];

  async init() {
    this.integrate(TARGETS);
  }
}
