import { type FC, useEffect } from 'react';
import MaterialSymbolsPersonalizedRecommendations from '~icons/material-symbols/personalized-recommendations';

import ContentCard, {
  ContentCardSkeleton,
} from '@/components/hikka/content-card';
import EmptyState from '@/components/ui/empty-state';
import { malType, RECOMMENDATIONS_TAB } from '@/hooks/use-recommendation';
import { isRecommendationsPagePath } from '@/utils/hikka-router';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

/** On `<html>` while the page replaces the authors tab it is shown over. */
const PAGE_ATTRIBUTE = 'data-hikka-features-recommendations';

const PAGE = `html[${PAGE_ATTRIBUTE}]`;
const AUTHORS_TAB = `${PAGE} main section[data-slot="block-surface"] a[aria-current="page"][href$="/staff"]`;
const AUTHORS_ROW = `${PAGE} [data-slot="drawer-content"] a[data-active="true"][href$="/staff"]`;

/**
 * hikka.io shows a title's authors under its recommendations (see
 * `ownPageRoute`): their list is hidden, and "Автори", which the site marks
 * as the current tab under the header and in the mobile drawer of sections,
 * looks like the other tabs (hikka.io's idle tab and row).
 */
const PAGE_STYLE = `
  ${PAGE} main > div > div.isolate > :not(recommendation-page) {
    display: none !important;
  }
  ${AUTHORS_TAB} {
    border-color: transparent;
    background-color: color-mix(in oklab, var(--secondary) 40%, transparent);
    color: var(--muted-foreground);
  }
  ${AUTHORS_TAB}:hover {
    background-color: var(--accent);
  }
  ${AUTHORS_ROW} {
    background-color: transparent;
    color: var(--muted-foreground);
    font-weight: inherit;
  }
  ${AUTHORS_ROW}:hover {
    background-color: var(--accent);
    color: var(--foreground);
  }
`;

/**
 * Where hikka.io names the tab it shows: the header's title and, on phones,
 * the line under the title in the top bar, which opens the sections.
 */
const TAB_NAMES = [
  'main section[data-slot="block-surface"] h1',
  'header [data-slot="drawer-trigger"] > span:last-child > span',
];

/**
 * Names the page where hikka.io names the tab underneath, the bar's line
 * included once it shows up. The text is the site's, so it goes back on
 * leaving, unless the site has renamed it by then.
 */
function useTabName(name: string) {
  useEffect(() => {
    const replaced = new Map<Text, string>();
    const apply = () => {
      // Leaving the page, the site renames the tab before this unmounts.
      if (!isRecommendationsPagePath(location.pathname)) return;
      for (const selector of TAB_NAMES) {
        const text = document.querySelector(selector)?.firstChild;
        if (text?.nodeType !== Node.TEXT_NODE) continue;
        const { data } = text as Text;
        if (data === name) continue;
        replaced.set(text as Text, data);
        (text as Text).data = name;
      }
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      for (const [text, data] of replaced) {
        if (text.data === name) text.data = data;
      }
    };
  }, [name]);
}

/**
 * Every title MAL users recommend with an anime, manga or novel that Hikka
 * has, at `/<type>/<slug>/recommendations`: the page that the block's title
 * and a tab of the title's open, laid out like its authors' tab.
 */
export default class RecommendationPageFeature extends BaseFeature {
  readonly id = 'recommendation-page';
  readonly pages = [HikkaPages.RecommendationsPage];

  async init() {
    const { ctx } = usePageStore.getState();
    const style = document.createElement('style');
    style.textContent = PAGE_STYLE;
    document.head.append(style);
    ctx.onInvalidated(() => style.remove());
    // The authors' route is under the page.
    this.followNavigation();

    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: 'first',
      // The tab's content, under the header and tabs (`content-subpage.tsx`).
      anchor: 'main > div > div.isolate',
      onMount: () => document.documentElement.setAttribute(PAGE_ATTRIBUTE, ''),
      onRemove: () => document.documentElement.removeAttribute(PAGE_ATTRIBUTE),
      render: (container) => <RecommendationPage container={container} />,
    });
  }
}

/** hikka.io's grid on a title's tabs: three columns on phones, five on wider screens. */
const GRID =
  'grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5';

const RecommendationPage: FC<{ container: HTMLElement }> = ({ container }) => {
  const { contentType } = usePageStore();
  const { data: content, isLoading: contentLoading } = useHikka();
  const { data, isLoading } = useRecommendation();
  useDocumentTitle(RECOMMENDATIONS_TAB);
  useTabName(RECOMMENDATIONS_TAB);

  if (contentLoading || isLoading) {
    return (
      <div className={GRID}>
        {Array.from({ length: 10 }).map((_, index) => (
          <ContentCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        bordered
        icon={<MaterialSymbolsPersonalizedRecommendations />}
        title="Рекомендацій не знайдено"
        description="Рікка засмучена через відсутність рекомендацій"
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className={GRID}>
        {data.map((item) => (
          <ContentCard key={item.slug} item={item} container={container} meta />
        ))}
      </div>
      <p className="text-muted-foreground text-sm">
        За рекомендаціями користувачів{' '}
        <a
          href={`https://myanimelist.net/${malType(contentType)}/${content.mal_id}/_/userrecs`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground underline underline-offset-4"
        >
          MyAnimeList
        </a>
      </p>
    </div>
  );
};
