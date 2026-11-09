import { type FC, Fragment, useEffect } from 'react';

import ContentCard, {
  ContentCardSkeleton,
} from '@/components/hikka/content-card';
import VirtualGrid from '@/components/virtual-grid';
import { RECOMMENDATIONS_TAB } from '@/hooks/use-recommendation';
import { isRecommendationsPagePath } from '@/utils/hikka-router';

import { OwnPageFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';
import { NoRecommendations } from './recommendation-block.feature';

/** On `<html>` while the page replaces the authors tab it is shown over. */
const PAGE_ATTRIBUTE = 'data-hikka-features-recommendations';

const PAGE = `html[${PAGE_ATTRIBUTE}]`;
const AUTHORS_TAB = `${PAGE} main section[data-slot="block-surface"] a[aria-current="page"][href$="/staff"]`;
const AUTHORS_ROW = `${PAGE} [data-slot="drawer-content"] a[data-active="true"][href$="/staff"]`;

/**
 * hikka.io shows a title's authors under its recommendations (see
 * `ownPageRoute`): "Автори", which the site marks as the current tab under
 * the header and in the mobile drawer of sections, looks like the other
 * tabs (hikka.io's idle tab and row).
 */
const PAGE_STYLE = `
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
 * Every title MAL and AniList users recommend with an anime, manga or novel
 * that Hikka has, at `/<type>/<slug>/recommendations`: the page that the block's title
 * and a tab of the title's open, laid out like its authors' tab.
 */
export default class RecommendationPageFeature extends OwnPageFeature {
  readonly id = 'recommendation-page';
  readonly pages = [HikkaPages.RecommendationsPage];

  init() {
    return this.createPage({
      attribute: PAGE_ATTRIBUTE,
      style: PAGE_STYLE,
      position: 'inline',
      append: 'first',
      // The tab's content, after the header and tabs (`content-subpage.tsx`);
      // the floating bar at the bottom has an `isolate` box as well.
      anchor: 'main > div > section[data-slot="block-surface"] ~ div.isolate',
      render: (container) => <RecommendationPage container={container} />,
    });
  }
}

/** hikka.io's grid on a title's tabs: three columns on phones, five on wider screens. */
const GRID =
  'grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5';

const RecommendationPage: FC<{ container: HTMLElement }> = ({ container }) => {
  const { isLoading: contentLoading } = useHikka();
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

  if (!data?.list.length) return <NoRecommendations />;

  return (
    <div className="flex flex-col gap-8">
      <VirtualGrid
        className={GRID}
        items={data.list}
        getKey={(item) => item.slug}
        renderItem={(item) => (
          <ContentCard item={item} container={container} meta />
        )}
      />
      <p className="text-muted-foreground text-sm">
        За рекомендаціями користувачів{' '}
        {data.sources.map(({ name, url }, index) => (
          <Fragment key={name}>
            {index > 0 && ' і '}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-4"
            >
              {name}
            </a>
          </Fragment>
        ))}
      </p>
    </div>
  );
};
