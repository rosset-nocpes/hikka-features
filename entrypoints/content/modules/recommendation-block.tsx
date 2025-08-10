import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import type { FC } from 'react';
import { createRoot } from 'react-dom/client';
import BlockButton from '@/components/hikka/block-button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import HFLogoSmall from '@/public/hikka-features-small.svg';
import HFLogoSmallDark from '@/public/hikka-features-small-dark.svg';
import MaterialSymbolsSadTabRounded from '~icons/material-symbols/sad-tab-rounded';
import { queryClient } from '..';

const recommendationBlock = async (location?: Element) => {
  if (document.body.querySelectorAll('recommendation-block').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'recommendation-block',
    position: 'inline',
    append: 'last',
    anchor:
      location ||
      document.querySelector(
        'main > div > div.flex.flex-col.gap-12 > div.grid.grid-cols-1.gap-12 > div.relative.order-2.flex.flex-col.gap-12',
      ),
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <RecommendationBlock container={container} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  container: HTMLElement;
}

const RecommendationBlock: FC<Props> = ({ container }) => {
  const [blockState, setBlockState] = useState<boolean>();

  const { contentType } = usePageStore();
  const content_data = useHikka().data;
  const { data, isLoading } = useRecommendation();

  const mal_id = content_data.mal_id;

  useEffect(() => {
    const initializeAsync = async () => {
      setBlockState(await recommendationBlockState.getValue());
    };

    initializeAsync();
  });
  recommendationBlockState.watch(setBlockState);

  return (
    <AnimatePresence>
      {blockState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4 lg:gap-8"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex scroll-m-20 items-center justify-between gap-2 font-bold font-unitysans text-xl tracking-normal">
              Схожий контент
              <img
                src={
                  container.classList.contains('dark')
                    ? HFLogoSmall
                    : HFLogoSmallDark
                }
                style={{ width: '21px', height: '20px' }}
              />
            </h3>
            <BlockButton
              href={`https://myanimelist.net/${contentType === 'novel' ? 'manga' : contentType}/${mal_id}`}
              disabled={isLoading || data?.recommendations.length === 0}
            />
          </div>
          <div className="-m-4 no-scrollbar gradient-mask-r-90-d md:gradient-mask-none relative grid auto-cols-scroll grid-flow-col grid-cols-scroll gap-4 overflow-x-scroll p-4 md:grid-cols-4 lg:gap-8">
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <AspectRatio
                    ratio={0.7}
                    className="skeleton animate-pulse rounded-md bg-secondary/60"
                  />
                  <div className="skeleton h-5 animate-pulse rounded-full bg-secondary/60" />
                </div>
              ))}
            {data?.recommendations.length === 0 &&
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <AspectRatio
                    ratio={0.7}
                    className="skeleton flex items-center justify-center rounded-md bg-secondary/60"
                  >
                    <MaterialSymbolsSadTabRounded className="size-9 text-muted-foreground" />
                  </AspectRatio>
                  <div className="skeleton h-5 rounded-full bg-secondary/60" />
                </div>
              ))}
            {data &&
              data.recommendations.length > 0 &&
              data.recommendations.map((item) => (
                <a
                  key={item.slug}
                  href={`https://hikka.io/${item.data_type}/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-2"
                >
                  <AspectRatio
                    ratio={0.7}
                    className="relative w-full overflow-hidden rounded-md bg-muted"
                  >
                    <img
                      className="absolute inset-0 h-full w-full bg-secondary/30 object-cover"
                      src={item.image}
                      alt={
                        item.title_ua ||
                        item.title_en ||
                        item.title_ja ||
                        item.title_original
                      }
                      loading="lazy"
                    />
                  </AspectRatio>
                  <span className="line-clamp-2 font-medium text-sm leading-5">
                    {item?.title_ua ||
                      item?.title_en ||
                      item?.title_ja ||
                      item?.title_original}
                  </span>
                </a>
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default recommendationBlock;
