import { Button } from '@/components/ui/button';
import useRecommendation from '@/hooks/use-recommendation';
import HikkaFLogoSmall from '@/public/hikka-features-small.svg';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { FC } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentScriptContext } from 'wxt/client';
import MaterialSymbolsArrowRightAltRounded from '~icons/material-symbols/arrow-right-alt-rounded';
import { queryClient } from '..';

const recommendationBlock = async (
  ctx: ContentScriptContext,
  anime_data: any,
  location?: Element,
) => {
  if (document.body.querySelectorAll('recommendation-block').length !== 0) {
    return;
  }

  return createShadowRootUi(ctx, {
    name: 'recommendation-block',
    position: 'inline',
    append: 'last',
    anchor:
      location ||
      document.querySelector(
        'body > div > main > div > div.flex.flex-col.gap-12 > div.grid.grid-cols-1.gap-12 > div.relative.order-2.flex.flex-col.gap-12',
      )!,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <RecommendationBlock anime_data={anime_data} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  anime_data: any;
}

const RecommendationBlock: FC<Props> = ({ anime_data }) => {
  const [blockState, setBlockState] = useState<boolean>();

  const { data, isLoading, isError } = useRecommendation(anime_data);

  const mal_id = anime_data.mal_id;

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
                src={HikkaFLogoSmall}
                style={{ width: '21px', height: '20px' }}
              />
            </h3>
            <Button
              size="icon-sm"
              variant="outline"
              disabled={isLoading || data?.recommendations.length === 0}
            >
              <a
                href={`https://myanimelist.net/anime/${mal_id}`}
                target="_blank"
              >
                <MaterialSymbolsArrowRightAltRounded className="text-lg" />
              </a>
            </Button>
          </div>
          <div className="-my-4 no-scrollbar -mx-4 gradient-mask-r-90-d md:gradient-mask-none relative grid auto-cols-scroll grid-flow-col grid-cols-scroll gap-4 overflow-x-scroll px-4 py-4 md:grid-cols-4 lg:gap-8">
            {isLoading
              ? Array.from({ length: 4 }).map(() => (
                  <div
                    className="skeleton animate-pulse rounded-md bg-secondary/60"
                    style={{ paddingBottom: '142.857%' }}
                  />
                ))
              : data?.recommendations.map((item) => (
                  <a
                    href={`https://hikka.io/anime/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col gap-2"
                  >
                    <div
                      className="relative overflow-hidden rounded-md"
                      style={{ paddingBottom: '142.857%' }}
                    >
                      <img
                        className="absolute inset-0 h-full w-full bg-secondary/30 object-cover"
                        src={item.image}
                        alt={item.title_ua || item.title_en || item.title_ja}
                        loading="lazy"
                      />
                      <p
                        className={`absolute top-2 left-2 rounded-md bg-secondary/80 px-2 py-1 text-sm ${
                          Math.round(
                            (item?.mal.votes / data.maxSingleVotes) * 100,
                          ) > 90
                            ? 'text-success'
                            : Math.round(
                                  (item?.mal.votes / data.maxSingleVotes) * 100,
                                ) > 50
                              ? 'text-warning'
                              : 'text-destructive'
                        }`}
                      >
                        {Math.round(
                          (item?.mal.votes / data.maxSingleVotes) * 100,
                        )}
                      </p>
                    </div>
                    <span className="line-clamp-2 font-medium text-sm leading-5">
                      {item?.title_ua || item?.title_en || item?.title_ja}
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
