import { createSignal, Match, Resource, Show, Switch } from "solid-js";
import { render } from "solid-js/web";
import MaterialSymbolsPlannerBannerAdPtRounded from "~icons/material-symbols/planner-banner-ad-pt-rounded";
import MaterialSymbolsPlannerBannerAdPtOutlineRounded from "~icons/material-symbols/planner-banner-ad-pt-outline-rounded";
import { Transition } from "solid-transition-group";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import localizedPoster from "./localized-poster";

export default async function localizedPosterButton(
  getNotionData: Resource<any>
) {
  if (document.body.querySelectorAll("#localized-poster-button").length !== 0) {
    return;
  }

  const [posterState, togglePosterState] = createSignal(
    await localizedPosterState.getValue()
  );

  const [posterButtonState, togglePosterButtonState] = createSignal(
    await localizedPosterButtonState.getValue()
  );

  localizedPosterButtonState.watch((state) => togglePosterButtonState(state));

  localizedPoster(getNotionData, posterState);

  render(
    () => (
      <Transition name="slide-fade" appear>
        <Show
          when={
            posterButtonState() && getNotionData() && getNotionData()["poster"]
          }
        >
          <div
            id="localized-poster-button"
            class="hikka-features absolute z-[1]"
          >
            <Tooltip placement="top">
              <TooltipTrigger
                as={Button<"button">}
                variant="ghost"
                size="icon-md"
                onClick={() => togglePosterState(!posterState())}
              >
                <Switch>
                  <Match when={posterState()}>
                    <MaterialSymbolsPlannerBannerAdPtRounded class="text-xl text-white" />
                  </Match>
                  <Match when={!posterState()}>
                    <MaterialSymbolsPlannerBannerAdPtOutlineRounded class="text-xl text-white" />
                  </Match>
                </Switch>
              </TooltipTrigger>
              <TooltipContent>Локалізувати постер</TooltipContent>
            </Tooltip>
          </div>
        </Show>
      </Transition>
    ),
    document.querySelector("div.top-0:nth-child(1)")!
  );
}
