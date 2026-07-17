import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { createRoot, type Root } from 'react-dom/client';

import { buttonVariants } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import HFLogoSmallDark from '@/public/hikka-features-small-dark.svg';
import HFLogoSmall from '@/public/hikka-features-small.svg';

import { queryClient } from '..';
import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

const SOURCES_HOSTS: Record<SourcesType, string> = {
  mal: 'myanimelist.net',
  anilist: 'anilist.co',
  anidb: 'anidb.net',
  ann: 'animenewsnetwork.com',
  wiki: 'en.wikipedia.org',
  amanogawa: 'amanogawa.space',
  mu: 'mangaupdates.com',
};

const SOURCE_TITLES: Record<SourcesType, string> = {
  mal: 'MyAnimeList',
  anilist: 'AniList',
  anidb: 'AniDB',
  ann: 'ANN',
  wiki: 'Wikipedia',
  amanogawa: 'Amanogawa',
  mu: 'MU',
};

const SOURCE_PATH_OVERRIDES: Partial<
  Record<MediaType | InfoType, Partial<Record<'mal' | 'al' | 'ad', string>>>
> = {
  character: { al: 'characters' },
  person: { mal: 'people', al: 'staff', ad: 'creator' },
  novel: { mal: 'manga', al: 'manga' },
};

const CONTENT_LINKS: Record<MediaType | InfoType, SourcesType[]> = {
  anime: ['mal', 'anilist', 'anidb', 'ann', 'wiki', 'amanogawa'],
  manga: ['mal', 'anilist', 'wiki', 'mu'],
  character: ['mal', 'anilist', 'anidb', 'ann'],
  person: ['mal', 'anilist', 'anidb', 'ann', 'wiki'],
  novel: ['mal', 'anilist', 'wiki', 'mu'],
};

const MEDIA_TYPES: readonly MediaType[] = ['anime', 'manga', 'novel'];

const isMediaType = (t: string | undefined): t is MediaType =>
  !!t && (MEDIA_TYPES as readonly string[]).includes(t);

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
  ctx: { data: any; content_type: MediaType | InfoType; title?: string },
): string | undefined => {
  const { data, content_type, title } = ctx;
  const override = (k: 'mal' | 'al' | 'ad') =>
    SOURCE_PATH_OVERRIDES[content_type]?.[k];
  const external = (s: SourcesType): string | undefined =>
    isMediaType(content_type)
      ? data?.external?.find((o: any) => o.url?.includes(SOURCES_HOSTS[s]))?.url
      : undefined;

  switch (source) {
    case 'mal':
      return `https://myanimelist.net/${override('mal') ?? content_type}${
        data?.mal_id ? `/${data.mal_id}` : `.php?q=${title}`
      }`;
    case 'anilist':
      return `https://anilist.co/search/${override('al') ?? content_type}?search=${title}&sort=SEARCH_MATCH`;
    case 'anidb': {
      // AniDB expects "Surname GivenName" for people/characters.
      const swapped =
        (content_type === 'person' || content_type === 'character') &&
        title?.split(' ').length === 2
          ? `${title.split(' ')[1]} ${title.split(' ')[0]}`
          : title;
      return (
        external('anidb') ??
        `https://anidb.net/${override('ad') ?? content_type}/?adb.search=${swapped}&do.search=1`
      );
    }
    case 'ann':
      return external('ann') ?? `https://www.animenewsnetwork.com/search?q=${title}`;
    case 'wiki':
      return content_type === 'character'
        ? undefined
        : (external('wiki') ??
          `https://en.wikipedia.org/w/index.php?search=${title}`);
    case 'mu':
      return `https://www.mangaupdates.com/series?search=${title}&perpage=25`;
    case 'amanogawa':
      return undefined; // resolved via useAmanogawaUrl
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

    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      append: (anchor, ui) => {
        if (isEdit()) {
          anchor.append(ui);
        } else {
          anchor.parentElement?.insertBefore(ui, anchor);
        }
      },
      anchor: () =>
        isEdit() ? 'div.grid > div' : '#content-right-side > #content-stats',
      css: `:host(${this.id}) { margin-bottom: -2rem !important; }`,
      inheritStyles: true,
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        syncFeatureTheme(container, { themeVariables: true });

        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <AniButtons />
          </QueryClientProvider>,
        );

        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    this.modalUi = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      append: 'first',
      anchor: '[data-slug][data-content-type] [data-slot="dialog-footer"]',
      css: `:host(${this.id}) { width: 100%; }`,
      inheritStyles: true,
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        syncFeatureTheme(container, { themeVariables: true });

        const modal = document.querySelector<HTMLElement>(
          '[data-slug][data-content-type]',
        );
        const modalSlug = modal?.dataset.slug;
        const modalContentType = modal?.dataset.contentType;

        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <AniButtons modalSlug={modalSlug} modalContentType={modalContentType} />
          </QueryClientProvider>,
        );

        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
  }

  override get shouldMount(): boolean {
    return (
      super.shouldMount || !!document.querySelector('[data-slug][data-content-type]')
    );
  }

  override get isMounted(): boolean {
    return !!this.ui?.mounted || !!this.modalUi?.mounted;
  }

  override mount() {
    if (super.shouldMount && this.ui && !this.ui.mounted) {
      this.ui.mount();
    }

    this.syncModalUi();
    this.startModalObserver();
  }

  override unmount() {
    if (this.ui?.mounted) {
      this.ui.remove();
    }

    if (this.modalUi?.mounted) {
      this.modalUi.remove();
    }

    this.modalObserver?.disconnect();
    this.modalObserver = null;
  }

  private startModalObserver() {
    this.modalObserver?.disconnect();
    this.modalObserver = new MutationObserver(() => this.syncModalUi());
    this.modalObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private syncModalUi() {
    const modalOpen = !!document.querySelector('[data-slug][data-content-type]');

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

interface AniButtonsProps {
  modalSlug?: string;
  modalContentType?: string;
}

const AniButtons = ({ modalSlug, modalContentType }: AniButtonsProps = {}) => {
  const { enabled } = useSettings().features.aniButtons;
  const pageResult = useHikka();
  const modalResult = useHikkaContent(modalSlug, modalContentType);

  const data = modalSlug ? modalResult.data : pageResult.data;
  const isModal = !!modalSlug || !!modalContentType;

  return (
    <AnimatePresence>
      {enabled && data && <AniButtonsContent data={data} isModal={isModal} />}
    </AnimatePresence>
  );
};

interface AniButtonsContentProps {
  data: any;
  isModal: boolean;
}

const AniButtonsContent = ({ data, isModal }: AniButtonsContentProps) => {
  const isEdit = usePageStore((s) => s.contentType === 'edit');
  const content_type: MediaType | InfoType =
    data?.data_type ?? data?.content_type;
  const title = pickTitle(data);

  const { data: agawaUrl, isLoading, isError } = useAmanogawaUrl(data);
  const sources = CONTENT_LINKS[content_type] ?? [];

  const amanogawaClass = isLoading
    ? 'animate-pulse'
    : isError
      ? 'pointer-events-none opacity-50'
      : '';

  const getUrl = (source: SourcesType): string | undefined =>
    source === 'amanogawa'
      ? agawaUrl
      : buildSourceUrl(source, { data, content_type, title });

  if (isModal) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0, scale: 0.93 }}
        animate={{ opacity: 1, height: 'auto', scale: 1 }}
        exit={{ opacity: 0, height: 0, scale: 0.93 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <ButtonGroup>
          {sources.map((source) => (
            <a
              key={source}
              data-slot="button"
              href={getUrl(source)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'icon-md' }),
                source === 'amanogawa' && amanogawaClass,
              )}
            >
              <Favicon host={SOURCES_HOSTS[source]} />
            </a>
          ))}
        </ButtonGroup>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'border-border overflow-hidden rounded-lg border',
        !isEdit && 'bg-secondary/20',
      )}
      initial={{ opacity: 0, height: 0, scale: 0.93, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', scale: 1, marginBottom: '2rem' }}
      exit={{ opacity: 0, height: 0, scale: 0.93, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-6 p-4">
        <h4 className="flex items-center justify-between">
          Інші джерела
          <img
            alt=""
            src={isHikkaDarkMode() ? HFLogoSmall : HFLogoSmallDark}
            style={{ width: '21px', height: '20px' }}
          />
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {sources.map((source) => (
            <a
              key={source}
              href={getUrl(source)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'hover:bg-secondary/60 flex items-center gap-2 rounded-sm p-1 text-sm font-medium transition',
                source === 'amanogawa' && amanogawaClass,
              )}
            >
              <Favicon host={SOURCES_HOSTS[source]} />
              {SOURCE_TITLES[source]}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
