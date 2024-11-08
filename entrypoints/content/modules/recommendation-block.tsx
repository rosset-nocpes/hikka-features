import { Button } from "@/components/ui/button";
import HFxCPRBadge from "@/public/hf-x-cpr.svg";
import Disclosure from "@corvu/disclosure";
import { Image } from "@kobalte/core/image";
import { createSignal, Resource, Show } from "solid-js";
import { For, MountableElement, render } from "solid-js/web";
import { Transition } from "solid-transition-group";
import MaterialSymbolsSadTabRounded from "~icons/material-symbols/sad-tab-rounded";

export default async function RecommendationBlock(
  getContents: Promise<any>,
  location?: MountableElement,
  smallerTitle?: boolean
) {
  if (document.body.querySelectorAll("#recommendation-block").length !== 0) {
    return;
  }

  const [blockState, setBlockState] = createSignal(
    await recommendationBlockState.getValue()
  );
  recommendationBlockState.watch((state) => setBlockState(state));

  var titles = []
  getContents['data'].slice(0, 4).array.forEach(element => {
    const hikkaAnime = fetch(`https://api.hikka.io/integrations/mal/anime/${element['myanimelistId']}`).json();
    titles.push({
        title: hikkaAnime["title_ua"] ? hikkaAnime["title_en"] ? hikkaAnime["title_ja"]
    });
  });

  render(
    () => (
      <Transition name="slide-fade">
        <Show when={blockState()}>
          <div class={"flex flex-col gap-4 lg:gap-8"} id="recommendation-block" >
            <h3
              class={`scroll-m-20 font-display ${
                smallerTitle ? "text-lg" : "text-xl"
              } font-bold tracking-normal`}
            >
              Схоже на це
            </h3>
            <div class={"grid grid-flow-col gap-4"}>
                          <For each={getContents['data'].slice(0, 4)}>
                              {(item) => (
                                  <a href={item.imgURLs[0]} target="_blank">
                                      <Image>
                                          <Image.Img
                                              loading="lazy"
                                              class={"size-fit rounded-md"}
                                              src={item.imgURLs[0]}
                                          />
                                      </Image>
                                      {"1"}
                                  </a>
                              )}
                          </For>
            </div>
          </div>
        </Show>
      </Transition>
    ),
    location ||
        document.querySelector(
        "body > main > div > div.flex.flex-col.gap-12 > div.grid.grid-cols-1.gap-12 > div.relative.order-2.flex.flex-col.gap-12"
        )!
  );
}
