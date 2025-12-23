import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { type FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HFLogoSmall from '@/public/hikka-features-small.svg';
import HFLogoSmallDark from '@/public/hikka-features-small-dark.svg';
import { queryClient } from '..';

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

const aniButtons = async (
  append: ContentScriptAppendMode = 'after',
  smallerTitle?: boolean,
  location?: Element,
  data?: any,
) => {
  if (document.body.querySelectorAll('ani-buttons').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'ani-buttons',
    position: 'inline',
    append,
    anchor:
      location ||
      document.querySelector(
        '.grid > div.flex.flex-col.gap-12.lg\\:col-span-1 > div',
      ),
    css: ':host(ani-buttons) { margin-bottom: -3rem; }',
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <AniButtons
            container={container}
            data={data}
            smallerTitle={smallerTitle}
          />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  container: HTMLElement;
  data?: any;
  smallerTitle?: boolean;
}

const AniButtons: FC<Props> = ({ container, data, smallerTitle }) => {
  const [blockState, setBlockState] = useState<boolean>();

  const hikka = useHikka();
  if (!data) data = hikka?.data;

  useEffect(() => {
    const initializeAsync = async () => {
      setBlockState(await aniButtonsState.getValue());
    };

    initializeAsync();
  }, []);

  const content_type: MediaType | InfoType = data?.data_type;

  const contentTypeMap: Record<string, Record<string, string>> = {
    character: {
      al: 'characters',
    },
    person: { mal: 'people', al: 'staff', ad: 'creator' },
    novel: { mal: 'manga', al: 'manga' },
  };

  const isMedia = Object.keys(MediaEnum).includes(content_type);
  const isAnime = content_type === 'anime';
  const title =
    data?.title_ja || data?.title_en || data?.title_original || data?.name_en;

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

  const anime_links: Website[] = [
    searchUrls.mal,
    searchUrls.anilist,
    searchUrls.anidb,
    searchUrls.ann,
    searchUrls.wiki,
    searchUrls.amanogawa,
  ];

  const manga_links: Website[] = [
    searchUrls.mal,
    searchUrls.anilist,
    searchUrls.wiki,
    searchUrls.mu,
  ];

  const character_links: Website[] = [
    searchUrls.mal,
    searchUrls.anilist,
    searchUrls.anidb,
    searchUrls.ann,
    searchUrls.wiki,
  ];

  const people_links: Website[] = [
    searchUrls.mal,
    searchUrls.anilist,
    searchUrls.anidb,
    searchUrls.ann,
    searchUrls.wiki,
  ];

  const {
    data: agawaUrl,
    isLoading: agawaUrlLoading,
    isError: agawaUrlError,
  } = useAmanogawaUrl(data);

  aniButtonsState.watch((state) => setBlockState(state));

  const compact = false;

  return (
    <AnimatePresence>
      {blockState && (
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, height: 0, scale: 0.93, marginBottom: 0 }}
          animate={{
            opacity: 1,
            height: 'auto',
            scale: 1,
            marginBottom: '3rem',
          }}
          exit={{ opacity: 0, height: 0, scale: 0.93, marginBottom: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <h3
            className={cn(
              'flex scroll-m-20 items-center justify-between font-bold tracking-normal',
              smallerTitle ? 'text-lg' : 'text-xl',
              compact && 'hidden',
            )}
          >
            Інші джерела
            <img
              src={
                container.classList.contains('dark')
                  ? HFLogoSmall
                  : HFLogoSmallDark
              }
              style={{ width: '21px', height: '20px' }}
            />
          </h3>
          <div
            className={cn(
              compact ? 'flex justify-between' : 'grid grid-cols-2 gap-2',
            )}
          >
            {(isAnime
              ? anime_links
              : content_type === 'character'
                ? character_links
                : content_type === 'person'
                  ? people_links
                  : manga_links
            ).map((elem) => (
              <a
                key={elem.title}
                href={elem.title === 'Amanogawa' ? agawaUrl : elem.url}
                target="_blank"
                className={cn(
                  'flex items-center gap-2 rounded-sm p-1 font-medium text-sm transition hover:bg-secondary/60',
                  elem.title === 'Amanogawa'
                    ? agawaUrlLoading
                      ? 'animate-pulse'
                      : agawaUrlError
                        ? 'pointer-events-none opacity-50'
                        : ''
                    : '',
                  compact && 'size-10!',
                )}
              >
                <span
                  className={cn(
                    'size-5 overflow-hidden rounded-sm border border-secondary/60 p-px',
                    compact && 'size-full!',
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default aniButtons;
