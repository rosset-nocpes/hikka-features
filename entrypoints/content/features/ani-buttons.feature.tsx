import { AnimatePresence, motion } from 'motion/react';
import { type Root } from 'react-dom/client';

import FeatureCard from '@/components/feature-card';
import { buttonVariants } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { reveal } from '@/utils/motion';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

type SourceContentType = MediaType | InfoType;

const SOURCES: Record<SourcesType, { host: string; title: string }> = {
  mal: { host: 'myanimelist.net', title: 'MyAnimeList' },
  anilist: { host: 'anilist.co', title: 'AniList' },
  anidb: { host: 'anidb.net', title: 'AniDB' },
  ann: { host: 'animenewsnetwork.com', title: 'ANN' },
  wiki: { host: 'en.wikipedia.org', title: 'Wikipedia' },
  mu: { host: 'mangaupdates.com', title: 'MU' },
};

const SOURCE_PATH_OVERRIDES: Partial<
  Record<SourceContentType, Partial<Record<'mal' | 'al' | 'ad', string>>>
> = {
  character: { al: 'characters' },
  person: { mal: 'people', al: 'staff', ad: 'creator' },
  novel: { mal: 'manga', al: 'manga' },
};

const CONTENT_LINKS: Record<SourceContentType, SourcesType[]> = {
  anime: ['mal', 'anilist', 'anidb', 'ann', 'wiki'],
  manga: ['mal', 'anilist', 'wiki', 'mu'],
  character: ['mal', 'anilist', 'anidb', 'ann'],
  person: ['mal', 'anilist', 'anidb', 'ann', 'wiki'],
  novel: ['mal', 'anilist', 'wiki', 'mu'],
};

const MEDIA_TYPES: readonly string[] = ['anime', 'manga', 'novel'];

/** The dialog hikka.io opens for a character or person from a list. */
const MODAL = '[data-slug][data-content-type]';

const pickTitle = (data: any): string | undefined =>
  [
    data?.title_ja,
    data?.title_en,
    data?.title_original,
    data?.content?.title_ja,
    data?.content?.title_en,
    data?.content?.title_original,
    data?.name_en,
    data?.content?.name_en,
  ].find(Boolean);

const buildSourceUrl = (
  source: SourcesType,
  data: any,
  contentType: SourceContentType,
): string | undefined => {
  const title = pickTitle(data);
  const override = (key: 'mal' | 'al' | 'ad') =>
    SOURCE_PATH_OVERRIDES[contentType]?.[key];
  const external = () =>
    MEDIA_TYPES.includes(contentType)
      ? data?.external?.find((link: any) =>
          link.url?.includes(SOURCES[source].host),
        )?.url
      : undefined;

  switch (source) {
    case 'mal':
      return `https://myanimelist.net/${override('mal') ?? contentType}${
        data?.mal_id ? `/${data.mal_id}` : `.php?q=${title}`
      }`;
    case 'anilist':
      return `https://anilist.co/search/${override('al') ?? contentType}?search=${title}&sort=SEARCH_MATCH`;
    case 'anidb': {
      // AniDB expects "Surname GivenName" for people/characters.
      const words = title?.split(' ');
      const swapped =
        (contentType === 'person' || contentType === 'character') &&
        words?.length === 2
          ? `${words[1]} ${words[0]}`
          : title;
      return (
        external() ??
        `https://anidb.net/${override('ad') ?? contentType}/?adb.search=${swapped}&do.search=1`
      );
    }
    case 'ann':
      return external() ?? `https://www.animenewsnetwork.com/search?q=${title}`;
    case 'wiki':
      return contentType === 'character'
        ? undefined
        : (external() ??
            `https://en.wikipedia.org/w/index.php?search=${title}`);
    case 'mu':
      return `https://www.mangaupdates.com/series?search=${title}&perpage=25`;
  }
};

const Favicon = ({ host }: { host: string }) => (
  <span className="border-secondary/60 size-5 overflow-hidden rounded-sm border p-px">
    <img
      alt=""
      className="size-full"
      src={`https://www.google.com/s2/favicons?domain=${host}`}
    />
  </span>
);

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
    const isEdit = () => document.location.pathname.startsWith('/edit/');

    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: (anchor, ui) => {
        if (isEdit()) anchor.append(ui);
        else anchor.parentElement?.insertBefore(ui, anchor);
      },
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

  override get shouldMount(): boolean {
    return super.shouldMount || !!document.querySelector(MODAL);
  }

  override get isMounted(): boolean {
    return !!this.ui?.mounted || !!this.modalUi?.mounted;
  }

  override mount() {
    if (super.shouldMount && this.ui && !this.ui.mounted) this.ui.mount();
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
      if (!super.shouldMount) {
        this.modalObserver?.disconnect();
        this.modalObserver = null;
      }
    }
  }
}

const contentTypeOf = (data: any): SourceContentType =>
  data?.data_type ?? data?.content_type;

const PageSources = () => {
  const { enabled } = useSettings().features.aniButtons;
  const isEdit = usePageStore((s) => s.contentType === 'edit');
  const { data } = useHikka();
  const contentType = contentTypeOf(data);

  return (
    <AnimatePresence>
      {enabled && data && (
        <FeatureCard
          title="Інші джерела"
          marginBottom="2rem"
          className={cn(isEdit && 'bg-transparent')}
        >
          <div className="grid grid-cols-2 gap-2">
            {(CONTENT_LINKS[contentType] ?? []).map((source) => (
              <a
                key={source}
                href={buildSourceUrl(source, data, contentType)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-secondary/60 flex items-center gap-2 rounded-sm p-1 text-sm font-medium transition"
              >
                <Favicon host={SOURCES[source].host} />
                {SOURCES[source].title}
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
  contentType: modalType,
}: {
  slug?: string;
  contentType?: string;
}) => {
  const { enabled } = useSettings().features.aniButtons;
  const { data } = useHikkaContent(modalType, slug);
  const contentType = contentTypeOf(data);

  return (
    <AnimatePresence>
      {enabled && data && (
        <motion.div {...reveal()}>
          <ButtonGroup>
            {(CONTENT_LINKS[contentType] ?? []).map((source) => (
              <a
                key={source}
                data-slot="button"
                href={buildSourceUrl(source, data, contentType)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'icon-md',
                })}
              >
                <Favicon host={SOURCES[source].host} />
              </a>
            ))}
          </ButtonGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
