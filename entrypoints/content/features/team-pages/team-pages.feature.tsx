import { navigateOnHikka, TEAM_PAGE_PATH } from '@/utils/hikka-router';

import { BaseFeature, createFeatureUi } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import { ContainerContext } from './parts';
import TeamList from './team-list';
import TeamPage from './team-page';

/** On `<html>` while a team page replaces the content of hikka.io's page. */
const PAGE_ATTRIBUTE = 'data-hikka-features-page';

/**
 * The page hikka.io's router shows under team pages (its home page, see
 * `entrypoints/hikka-router.ts`) stays mounted but hidden, and the mobile
 * tab bar doesn't light "Головна" for it.
 */
const PAGE_STYLE = `
  html[${PAGE_ATTRIBUTE}] main > :not(team-pages) { display: none !important; }
  html[${PAGE_ATTRIBUTE}] nav.fixed a[href="/"][data-active="true"] > span {
    background-color: transparent !important;
    color: inherit !important;
    font-weight: inherit !important;
  }
`;

/**
 * Opens hikka.io's home page from its links: under a team page the site
 * thinks it's there, and its mobile tab only scrolls up.
 */
const goHome = (event: MouseEvent) => {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !(event.target instanceof Element) ||
    !event.target.closest('a[href="/"]')
  ) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  navigateOnHikka('/');
};

/**
 * The extension's own pages: the list of teams (`/teams`) and each team's
 * page (`/teams/<slug>`), in the content area of hikka.io's layout.
 */
export default class TeamPagesFeature extends BaseFeature {
  readonly id = 'team-pages';
  readonly pages = [HikkaPages.TeamPages];

  async init() {
    const { ctx } = usePageStore.getState();
    const style = document.createElement('style');
    style.textContent = PAGE_STYLE;
    document.head.append(style);
    ctx.onInvalidated(() => style.remove());
    // Home is the route under team pages.
    this.followNavigation();

    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: 'first',
      anchor: 'main',
      onMount: () => {
        document.documentElement.setAttribute(PAGE_ATTRIBUTE, '');
        document.addEventListener('click', goHome, true);
      },
      onRemove: () => {
        document.documentElement.removeAttribute(PAGE_ATTRIBUTE);
        document.removeEventListener('click', goHome, true);
      },
      render: (container) => (
        <ContainerContext value={container}>
          <TeamPages />
        </ContainerContext>
      ),
    });
  }
}

const TeamPages = () => {
  const path = useLocationPath();
  const slug = path.match(TEAM_PAGE_PATH)?.[1];

  return slug ? (
    <TeamPage key={slug} slug={decodeURIComponent(slug)} />
  ) : (
    <TeamList />
  );
};
