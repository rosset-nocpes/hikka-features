import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HikkaFLogoSmall from '@/public/hikka-features-small.svg';
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
  append: ContentScriptAppendMode = 'before',
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
    anchor: location || document.querySelector('.order-1 > div:nth-child(2)')!,
    css: ':host(ani-buttons) { margin-bottom: -3rem; }',
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <AniButtons data={data} smallerTitle={smallerTitle} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  data?: any;
  smallerTitle?: boolean;
}

const AniButtons: FC<Props> = ({ data, smallerTitle }) => {
  const [blockState, setBlockState] = useState<boolean>();

  const { contentType: path } = usePageStore();

  if (!data) {
    let queryFunc = useHikkaAnime;
    switch (path) {
      case 'manga':
      case 'novel':
        queryFunc = useHikkaManga;
    }

    data = queryFunc().data;
  }

  useEffect(() => {
    const initializeAsync = async () => {
      setBlockState(await aniButtonsState.getValue());
    };

    initializeAsync();
  }, []);

  const content_type: MediaType | InfoType = data.data_type;

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
    data.title_ja || data.title_en || data.title_original || data.name_en;

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
      ? data.external.find((obj: any) => obj.url?.includes(hosts[website]))?.url
      : null;

  const searchUrls: Record<SourcesType, Website> = {
    mal: {
      title: 'MyAnimeList',
      host: hosts.mal,
      url: `https://myanimelist.net/${
        contentTypeMap[content_type]?.mal || content_type
      }${data.mal_id ? `/${data.mal_id}` : `.php?q=${title}`}`,
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

  let manga_links: Website[] = [
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

  return (
    <AnimatePresence>
      {blockState && (
        <motion.div
          className="mb-12 flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h3
            className={`flex scroll-m-20 items-center justify-between font-unitysans ${
              smallerTitle ? 'text-lg' : 'text-xl'
            } font-bold tracking-normal`}
          >
            Інші джерела
            <img
              src={HikkaFLogoSmall}
              style={{ width: '21px', height: '20px' }}
            />
          </h3>
          <div className="grid grid-cols-2 gap-2">
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
                )}
              >
                <span className="size-5 overflow-hidden rounded-sm border border-secondary/60 p-px">
                  <img
                    className="mr-0.5 size-4"
                    src={`https://www.google.com/s2/favicons?domain=${elem.host}`}
                  />
                </span>
                {elem.title}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default aniButtons;
