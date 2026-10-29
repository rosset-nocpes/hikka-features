import { type ReactNode, useEffect, useRef } from 'react';

import {
  DRAWER_ROW,
  onDrawerLinkClick,
  TAB,
  TAB_ACTIVE,
  TAB_IDLE,
} from '@/components/hikka/nav-styles';
import { RECOMMENDATIONS_TAB } from '@/hooks/use-recommendation';
import {
  isRecommendationsPagePath,
  onHikkaLinkClick,
  recommendationsPagePath,
} from '@/utils/hikka-router';

import { AnchoredUisFeature, renderApp } from '../core/base-feature';
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
    <a
      href={href}
      onClick={onDrawerLinkClick}
      data-active={active}
      aria-current={active ? 'page' : undefined}
      className={DRAWER_ROW}
    >
      <span>{RECOMMENDATIONS_TAB}</span>
    </a>
  );
};

const TARGETS: { find: () => HTMLElement | undefined; render: ReactNode }[] = [
  {
    find: findDiscussion('main section[data-slot="block-surface"]'),
    render: <Tab />,
  },
  {
    find: findDiscussion('[data-slot="drawer-content"]'),
    render: <DrawerRow />,
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
    const { ctx } = usePageStore.getState();
    this.uis = TARGETS.map((target) => {
      const ui = createIntegratedUi(ctx, {
        tag: this.id,
        position: 'inline',
        append: 'before',
        anchor: target.find,
        onMount(wrapper) {
          // Lays the link out as one of the list's own.
          wrapper.style.display = 'contents';
          return renderApp(wrapper, target.render);
        },
        onRemove: (root) => root?.unmount(),
      });
      return { present: () => !!target.find(), ui, element: () => ui.wrapper };
    });
  }
}
