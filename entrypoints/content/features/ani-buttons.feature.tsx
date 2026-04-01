import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, type FC } from 'react';
import { createRoot } from 'react-dom/client';

import HFLogoSmallDark from '@/public/hikka-features-small-dark.svg';
import HFLogoSmall from '@/public/hikka-features-small.svg';

import { queryClient } from '..';
import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

interface Website {
  title: string;
  host: string;
  url?: string;
}

enum MediaEnum {
  Anime = 'anime',
  Manga = 'manga',
  Novel = 'novel',
}

export default class AniButtonsFeature extends BaseFeature {
  readonly id = 'ani-buttons';
  readonly pages = [
    HikkaPages.AnimeMainPage,
    HikkaPages.MangaMainPage,
    HikkaPages.NovelMainPage,
    HikkaPages.EditContent,
  ];

  async init() {
    const isEdit = () => document.location.pathname.startsWith('/edit/');
    const creatingEdit = () =>
      document.location.pathname.startsWith('/edit/new');

    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      append: (anchor, ui) => {
        if (isEdit()) {
          anchor.append(ui);
        } else {
          anchor.parentElement?.insertBefore(ui, anchor.nextElementSibling);
        }
      },
      anchor: () =>
        isEdit()
          ? `div.gap-12:nth-child(2) > section:nth-child(${creatingEdit() ? 1 : 2})`
          : '.grid.grid-cols-1 > div:nth-of-type(3) > div',
      css: `:host(${this.id}) { margin-bottom: -2rem !important; }`,
      inheritStyles: true,
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        container.style = getThemeVariables();
        container.classList.toggle(
          'dark',
          getComputedStyle(document.documentElement).colorScheme === 'dark',
        );

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
  }
}

const AniButtons = () => {
  const { enabled } = useSettings().features.aniButtons;

  const { data } = useHikka();

  const content_type: MediaType | InfoType =
    data?.data_type || data?.content_type;

  const contentTypeMap: Record<string, Record<string, string>> = {
    character: {
      al: 'characters',
    },
    person: { mal: 'people', al: 'staff', ad: 'creator' },
    novel: { mal: 'manga', al: 'manga' },
  };

  const isMedia = Object.keys(MediaEnum).includes(content_type);
  const title =
    data?.title_ja ||
    data?.title_en ||
    data?.title_original ||
    data?.name_en ||
    data?.content.name_en;

  const hosts: Record<SourcesType, string> = {
    mal: 'myanimelist.net',
    anilist: 'anilist.co',
    anidb: 'anidb.net',
    ann: 'animenewsnetwork.com',
    wiki: 'en.wikipedia.org',
    amanogawa: 'amanogawa.space',
    mu: 'mangaupdates.com',
  };

  const getUrl = (website: SourcesType) =>
    isMedia
      ? data?.external.find((obj: any) => obj.url?.includes(hosts[website]))
          ?.url
      : null;

  const searchUrls: Record<SourcesType, Website> = {
    mal: {
      title: 'MyAnimeList',
      host: hosts.mal,
      url: `https://myanimelist.net/${
        contentTypeMap[content_type]?.mal || content_type
      }${data?.mal_id ? `/${data?.mal_id}` : `.php?q=${title}`}`,
    },
    anilist: {
      title: 'AniList',
      host: hosts.anilist,
      url: `https://anilist.co/search/${
        contentTypeMap[content_type]?.al || content_type
      }?search=${title}&sort=SEARCH_MATCH`,
    },
    anidb: {
      title: 'AniDB',
      host: hosts.anidb,
      url:
        getUrl('anidb') ??
        `https://anidb.net/${
          contentTypeMap[content_type]?.ad || content_type
        }/?adb.search=${
          ['person', 'character'].includes(content_type) &&
          title.split(' ').length === 2
            ? `${title.split(' ')[1]} ${title.split(' ')[0]}`
            : title
        }&do.search=1`,
    },
    ann: {
      title: 'ANN',
      host: hosts.ann,
      url:
        getUrl('ann') ?? `https://www.animenewsnetwork.com/search?q=${title}`,
    },
    wiki: {
      title: 'Wikipedia',
      host: hosts.wiki,
      url:
        content_type !== 'character'
          ? (getUrl('wiki') ??
            `https://en.wikipedia.org/w/index.php?search=${title}`)
          : null,
    },
    amanogawa: {
      title: 'Amanogawa',
      host: hosts.amanogawa,
    },
    mu: {
      title: 'MU',
      host: hosts.mu,
      url: `https://www.mangaupdates.com/series?search=${title}&perpage=25`,
    },
  };

  const contentLinks: Record<MediaType | InfoType, Website[]> = {
    anime: [
      searchUrls.mal,
      searchUrls.anilist,
      searchUrls.anidb,
      searchUrls.ann,
      searchUrls.wiki,
      searchUrls.amanogawa,
    ],
    manga: [searchUrls.mal, searchUrls.anilist, searchUrls.wiki, searchUrls.mu],
    character: [
      searchUrls.mal,
      searchUrls.anilist,
      searchUrls.anidb,
      searchUrls.ann,
      searchUrls.wiki,
    ],
    person: [
      searchUrls.mal,
      searchUrls.anilist,
      searchUrls.anidb,
      searchUrls.ann,
      searchUrls.wiki,
    ],
    novel: [searchUrls.mal, searchUrls.anilist, searchUrls.wiki, searchUrls.mu],
  };

  const {
    data: agawaUrl,
    isLoading: agawaUrlLoading,
    isError: agawaUrlError,
  } = useAmanogawaUrl(data);

  const compact = false;

  return (
    <AnimatePresence>
      {enabled && data && (
        <motion.div
          className="overflow-hidden rounded-lg border border-border bg-secondary/20"
          initial={{ opacity: 0, height: 0, scale: 0.93, marginBottom: 0 }}
          animate={{
            opacity: 1,
            height: 'auto',
            scale: 1,
            marginBottom: '2rem',
          }}
          exit={{ opacity: 0, height: 0, scale: 0.93, marginBottom: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-6 p-4">
            <h4
              className={cn(
                'flex items-center justify-between',
                compact && 'hidden',
              )}
            >
              Інші джерела
              <img
                src={
                  document.documentElement.classList.contains('dark')
                    ? HFLogoSmall
                    : HFLogoSmallDark
                }
                style={{ width: '21px', height: '20px' }}
              />
            </h4>
            <div
              className={cn(
                compact ? 'flex justify-between' : 'grid grid-cols-2 gap-2',
              )}
            >
              {contentLinks[content_type].map((elem) => (
                <a
                  key={elem.title}
                  href={elem.title === 'Amanogawa' ? agawaUrl : elem.url}
                  target="_blank"
                  className={cn(
                    'flex items-center gap-2 rounded-sm p-1 text-sm font-medium transition hover:bg-secondary/60',
                    elem.title === 'Amanogawa'
                      ? agawaUrlLoading
                        ? 'animate-pulse'
                        : agawaUrlError
                          ? 'pointer-events-none opacity-50'
                          : ''
                      : '',
                    compact && '!size-10',
                  )}
                >
                  <span
                    className={cn(
                      'size-5 overflow-hidden rounded-sm border border-secondary/60 p-px',
                      compact && '!size-full',
                    )}
                  >
                    <img
                      className="size-full"
                      src={`https://www.google.com/s2/favicons?domain=${elem.host}`}
                    />
                  </span>
                  {!compact && elem.title}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
