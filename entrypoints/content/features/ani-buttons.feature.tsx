import { AnimatePresence, motion } from 'motion/react';
import { type Root } from 'react-dom/client';

import type { HikkaContent } from '@/hooks/use-hikka';

import FeatureCard from '@/components/feature-card';
import { buttonVariants } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { reveal } from '@/utils/motion';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

type SourceContentType = MediaType | InfoType;

const SOURCES: Record<
  SourcesType,
  { host: string; title: string; icon?: string }
> = {
  mal: { host: 'myanimelist.net', title: 'MyAnimeList' },
  anilist: { host: 'anilist.co', title: 'AniList' },
  anidb: {
    host: 'anidb.net',
    title: 'AniDB',
    icon: '/icons/platforms/anidb.png',
  },
  ann: {
    host: 'animenewsnetwork.com',
    title: 'ANN',
    icon: '/icons/platforms/ann.png',
  },
  wiki: {
    host: 'en.wikipedia.org',
    title: 'Wikipedia',
    icon: '/icons/platforms/wikipedia.png',
  },
  mu: { host: 'mangaupdates.com', title: 'MangaUpdates' },
};

const iconOf = (source: SourcesType) =>
  SOURCES[source].icon ??
  `https://www.google.com/s2/favicons?domain=${SOURCES[source].host}&sz=64`;

/** A source's path for the content type, where it isn't the type itself. */
const SOURCE_PATHS: Partial<
  Record<SourceContentType, Partial<Record<SourcesType, string>>>
> = {
  character: { anilist: 'characters' },
  person: { mal: 'people', anilist: 'staff', anidb: 'creator' },
  novel: { mal: 'manga', anilist: 'manga' },
};

const CONTENT_LINKS: Record<SourceContentType, SourcesType[]> = {
  anime: ['mal', 'anilist', 'anidb', 'ann', 'wiki'],
  manga: ['mal', 'anilist', 'wiki', 'mu'],
  character: ['mal', 'anilist', 'anidb', 'ann'],
  person: ['mal', 'anilist', 'anidb', 'ann', 'wiki'],
  novel: ['mal', 'anilist', 'wiki', 'mu'],
};

const MEDIA_TYPES: readonly SourceContentType[] = ['anime', 'manga', 'novel'];

/** The dialog hikka.io opens for a character or person from a list. */
const MODAL = '[data-slug][data-content-type]';

interface SourceLink {
  source: SourcesType;
  href: string;
  /** A search by title, for want of the title's own page. */
  search: boolean;
}

const pickTitle = (data: HikkaContent): string =>
  [
    data.title_ja,
    data.title_en,
    data.title_original,
    data.content?.title_ja,
    data.content?.title_en,
    data.content?.title_original,
    data.name_en,
    data.content?.name_en,
  ].find(Boolean) ?? '';

const sourceLink = (
  source: SourcesType,
  data: HikkaContent,
  contentType: SourceContentType,
): SourceLink | undefined => {
  const title = pickTitle(data);
  const q = encodeURIComponent(title);
  const path = SOURCE_PATHS[contentType]?.[source] ?? contentType;
  const direct = (href?: string) =>
    href ? { source, href, search: false } : undefined;
  const search = (href: string) => ({ source, href, search: true });
  const external = (): string | undefined =>
    MEDIA_TYPES.includes(contentType)
      ? data.external?.find((link) => link.url.includes(SOURCES[source].host))
          ?.url
      : undefined;

  switch (source) {
    case 'mal':
      return data.mal_id
        ? direct(`https://myanimelist.net/${path}/${data.mal_id}`)
        : search(`https://myanimelist.net/${path}.php?q=${q}`);
    case 'anilist':
      return search(
        `https://anilist.co/search/${path}?search=${q}&sort=SEARCH_MATCH`,
      );
    case 'anidb': {
      // AniDB expects "Surname GivenName" for people/characters.
      const words = title.split(' ');
      const swapped =
        (contentType === 'person' || contentType === 'character') &&
        words.length === 2
          ? `${words[1]} ${words[0]}`
          : title;
      return (
        direct(external()) ??
        search(
          `https://anidb.net/${path}/?adb.search=${encodeURIComponent(swapped)}&do.search=1`,
        )
      );
    }
    case 'ann':
      return (
        direct(external()) ??
        search(`https://www.animenewsnetwork.com/search?q=${q}`)
      );
    case 'wiki':
      return contentType === 'character'
        ? undefined
        : (direct(external()) ??
            search(`https://en.wikipedia.org/w/index.php?search=${q}`));
    case 'mu':
      return search(
        `https://www.mangaupdates.com/series?search=${q}&perpage=25`,
      );
  }
};

const sourceLinks = (data: HikkaContent): SourceLink[] => {
  const contentType = (data.data_type ??
    data.content_type) as SourceContentType;
  return (CONTENT_LINKS[contentType] ?? []).flatMap(
    (source) => sourceLink(source, data, contentType) ?? [],
  );
};

const linkTitle = ({ source, search }: SourceLink) =>
  search ? `${SOURCES[source].title}: пошук за назвою` : SOURCES[source].title;

export default class AniButtonsFeature extends BaseFeature {
  readonly id = 'ani-buttons';
  readonly pages = [
    HikkaPages.AnimeMainPage,
    HikkaPages.MangaMainPage,
    HikkaPages.NovelMainPage,
    HikkaPages.EditContent,
  ];
  private modalUi: ShadowRootContentScriptUi<Root> | null = null;
  private modalObserver: MutationObserver | null = null;

  async init() {
    const isEdit = () => location.pathname.startsWith('/edit/');

    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: (anchor, ui) =>
        isEdit() ? anchor.append(ui) : anchor.before(ui),
      anchor: () =>
        isEdit() ? 'div.grid > div' : '#content-right-side > #content-stats',
      hostCss: 'margin-bottom: -2rem !important;',
      render: () => <PageSources />,
    });

    this.modalUi = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: 'first',
      anchor: `${MODAL} [data-slot="dialog-footer"]`,
      hostCss: 'width: 100%;',
      render: () => {
        const modal = document.querySelector<HTMLElement>(MODAL);
        return (
          <ModalSources
            slug={modal?.dataset.slug}
            contentType={modal?.dataset.contentType}
          />
        );
      },
    });
  }

  /** The page block's pages, and any with the dialog open. */
  override get shouldMount(): boolean {
    return this.onPage || !!document.querySelector(MODAL);
  }

  private get onPage() {
    return this.matches(location.pathname);
  }

  override get isMounted(): boolean {
    return !!this.ui?.mounted || !!this.modalUi?.mounted;
  }

  override mount() {
    if (this.onPage && this.ui) {
      // hikka.io re-renders the column, dropping the block, and WXT still
      // counts it as mounted.
      if (this.ui.mounted) this.ui.remove();
      this.ui.mount();
    }
    this.syncModalUi();
    this.modalObserver?.disconnect();
    this.modalObserver = new MutationObserver(() => this.syncModalUi());
    this.modalObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  override unmount() {
    if (this.ui?.mounted) this.ui.remove();
    if (this.modalUi?.mounted) this.modalUi.remove();
    this.modalObserver?.disconnect();
    this.modalObserver = null;
  }

  private syncModalUi() {
    const modalOpen = !!document.querySelector(MODAL);
    if (modalOpen && this.modalUi && !this.modalUi.mounted) {
      this.modalUi.mount();
    } else if (!modalOpen && this.modalUi?.mounted) {
      this.modalUi.remove();
      if (!this.onPage) {
        this.modalObserver?.disconnect();
        this.modalObserver = null;
      }
    }
  }
}

const PageSources = () => {
  const { enabled } = useSettings().features.aniButtons;
  const { data } = useHikka();
  const links = data ? sourceLinks(data) : [];

  return (
    <AnimatePresence>
      {enabled && links.length > 0 && (
        <FeatureCard title="Інші джерела" marginBottom="2rem">
          {/* Rows fill up like hikka.io's profile links, each one flush. */}
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.source}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={linkTitle(link)}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'md' }),
                  'focus-visible:ring-ring/50 min-w-0 flex-auto gap-2 focus-visible:ring-[3px]',
                )}
              >
                <img
                  alt=""
                  src={iconOf(link.source)}
                  className="size-5 rounded-sm object-contain"
                />
                <span className="truncate">{SOURCES[link.source].title}</span>
              </a>
            ))}
          </div>
        </FeatureCard>
      )}
    </AnimatePresence>
  );
};

/** The same links as icons in the character or person dialog. */
const ModalSources = ({
  slug,
  contentType,
}: {
  slug?: string;
  contentType?: string;
}) => {
  const { enabled } = useSettings().features.aniButtons;
  const { data } = useHikkaContent(contentType, slug);
  const links = data ? sourceLinks(data) : [];

  return (
    <AnimatePresence>
      {enabled && links.length > 0 && (
        <motion.div {...reveal()}>
          <ButtonGroup>
            {links.map((link) => (
              <a
                key={link.source}
                data-slot="button"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOURCES[link.source].title}
                title={linkTitle(link)}
                className={buttonVariants({
                  variant: 'outline',
                  size: 'icon-md',
                })}
              >
                <img
                  alt=""
                  src={iconOf(link.source)}
                  className="size-5 object-contain"
                />
              </a>
            ))}
          </ButtonGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
