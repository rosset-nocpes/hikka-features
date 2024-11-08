import { createSignal, Show, onMount } from "solid-js";
import { MountableElement, render } from "solid-js/web";
import { Transition } from "solid-transition-group";
import { Button } from "@/components/ui/button";
import MaterialSymbolsArrowRightAltRounded from "~icons/material-symbols/arrow-right-alt-rounded";

async function fetchDetailedData(anibrainItem: any) {
  const malId = anibrainItem.myanimelistId;
  const response = await fetch(`https://hikka.io/api/integrations/mal/anime/${malId}`);
  if (!response.ok) {
    throw new Error(`API request failed with status code ${response.status}`);
  }
  const data = await response.json();
  return data; 
}

export default async function recommendationBlock(
  anime_data: any,
  recommendationBlockLocation?: MountableElement
) {
  if (document.body.querySelectorAll("#recommendation-block").length !== 0) {
    return;
  }

  const [blockState, setBlockState] = createSignal(
    await recommendationBlockState.getValue()
  );
  recommendationBlockState.watch((state) => setBlockState(state));

  const [recommendations, setRecommendations] = createSignal<any[]>([]);
  
  const [loading, setLoading] = createSignal(true);
  const title = anime_data.title_ja || anime_data.title_en || anime_data.title_original || anime_data.name_en;

  async function fetchRecommendations(title_en: string) {
    try {
      const searchResponse = await fetch(
        `https://corsproxy.io/?https://anibrain.ai/api/-/recommender/autosuggest?searchValue=${title_en}&mediaType=ANIME&adult=false`
      );
      const searchData = await searchResponse.json();

      // const mediaId = searchData?.data?.[0]?.id;
      const mediaId = searchData?.data?.[0]?.id;

      if (!mediaId) {
        console.warn("Media ID not found, skipping recommendation request.");
        setLoading(false);
        return;
      }
      const recommendationResponse = await fetch(
        `https://corsproxy.io/?https://anibrain.ai/api/-/recommender/recs/anime?filterCountry=[]&filterFormat=["movie","ona","tv"]&filterGenre={}&filterTag={"max":{},"min":{}}&filterRelease=[1917,2024]&filterScore=0&algorithmWeights={"genre":0.3,"setting":0.15,"synopsis":0.4,"theme":0.2}&mediaId=${mediaId}&mediaType=ANIME&adult=false&page=1`
      );
      const recommendationData = await recommendationResponse.json();

      var result: Promise<any>[] = [];
      for (const element of recommendationData.data.slice(0, 4)) {
        try {
          const hikkaData = await fetchDetailedData(element);
          result.push({...hikkaData, anibrain: {...element}});
          await new Promise((resolve) => setTimeout(resolve, 250));
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, 700)); 
          const hikkaData = await fetchDetailedData(element); 
          result.push({...hikkaData, anibrain: {...element}});
        }
      }
      setRecommendations(result || []);
    } catch (error) {
      console.error("Error during requests:", error);
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    fetchRecommendations(title);
  });
  
  render(
    () => (
      <Transition name="slide-fade">
        <Show when={blockState()}>
          <div class="flex flex-col gap-4 lg:gap-8" id="recommendation-block">
            <div class="flex items-center justify-between gap-2">
              <h3 class="scroll-m-20 font-display text-lg font-bold tracking-normal">
                Схожий контент
              </h3>
              <Button size="icon-sm" variant="outline" disabled={loading() || recommendations().length == 0}>
                {
                <a
                  href={`https://anibrain.ai/recommender/anime?search_id=${recommendations()[0]?.anibrain?.edgeId?.split("_")[0]}&search_title`}
                  target="_blank"
                >
                  <MaterialSymbolsArrowRightAltRounded class="text-lg" />
                </a>
                }
              </Button>
            </div>
  
            <div class="relative -my-4 grid gap-4 py-4 lg:gap-8 md:grid-cols-4 no-scrollbar -mx-4 auto-cols-scroll grid-flow-col grid-cols-scroll overflow-x-scroll px-4 gradient-mask-r-90-d md:gradient-mask-none">
              {loading()
                ? Array.from({ length: 4 }).map(() => (
                    <div
                      class="skeleton animate-pulse bg-secondary/60 rounded-md"
                      style={{ "padding-bottom": "142.857%" }}
                    />
                  ))
                : recommendations().map((item) => (
                    <a
                      href={`https://hikka.io/anime/${item.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div class="group relative flex w-full flex-col gap-2">
                        <div
                          class="relative rounded-md overflow-hidden"
                          style={{ "padding-bottom": "142.857%" }}
                        >
                          <img
                            class="object-cover w-full h-full absolute inset-0 bg-secondary/30"
                            src={item.poster}
                            alt={item.title_ua || item.title_en || item.title_ja}
                            loading="lazy"
                          />
                          <p
                            class={`absolute top-2 left-2 px-2 py-1 rounded-md bg-secondary/80 text-sm ${
                              item.anibrain.score > 90
                                ? "text-success"
                                : item.anibrain.score > 80
                                ? "text-warning"
                                : "text-destructive"
                            }`}
                          >
                            {item.anibrain.score}
                          </p>
                        </div>
                        <label class="text-sm font-medium leading-5 line-clamp-2">
                          {item.title_ua || item.title_en || item.title_ja}
                        </label>
                      </div>
                    </a>
                  ))}
            </div>
          </div>
        </Show>
      </Transition>
    ),
    recommendationBlockLocation ||
      document.querySelector(
        "body > main > div > div.flex.flex-col.gap-12 > div.grid.grid-cols-1.gap-12 > div.relative.order-2.flex.flex-col.gap-12"
      )!
  );
}  