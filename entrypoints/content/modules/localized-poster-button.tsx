import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Match, Resource, Show, Switch, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { Transition } from "solid-transition-group";
import MaterialSymbolsPlannerBannerAdPtOutlineRounded from "~icons/material-symbols/planner-banner-ad-pt-outline-rounded";
import MaterialSymbolsPlannerBannerAdPtRounded from "~icons/material-symbols/planner-banner-ad-pt-rounded";
import localizedPoster from "./localized-poster";

export default async function localizedPosterButton(
	getNotionData: Resource<any>,
) {
	if (document.body.querySelectorAll("#localized-poster-button").length !== 0) {
		return;
	}

	const [posterState, togglePosterState] = createSignal(
		await localizedPosterState.getValue(),
	);

	const [posterButtonState, togglePosterButtonState] = createSignal(
		await localizedPosterButtonState.getValue(),
	);

	localizedPosterButtonState.watch((state) => togglePosterButtonState(state));

	localizedPoster(getNotionData, posterState);

	const start_node = document.querySelector("div.absolute.bottom-2.right-2")!;
	start_node.insertAdjacentHTML(
		"afterbegin",
		'<div id="localized-poster-button" class="hikka-features"></div>',
	);
	const localized_poster_button = document.querySelector(
		"#localized-poster-button",
	)!;

	render(
		() => (
			<Transition name="slide-fade" appear>
				<Show
					when={
						posterButtonState() && getNotionData() && getNotionData()["poster"]
					}
				>
					<div>
						<Tooltip placement="top">
							<TooltipTrigger
								as={Button<"button">}
								variant="ghost"
								size="icon-md"
								onClick={() => togglePosterState(!posterState())}
							>
								<Switch>
									<Match when={posterState()}>
										<MaterialSymbolsPlannerBannerAdPtRounded class="text-lg text-white" />
									</Match>
									<Match when={!posterState()}>
										<MaterialSymbolsPlannerBannerAdPtOutlineRounded class="text-lg text-white" />
									</Match>
								</Switch>
							</TooltipTrigger>
							<TooltipContent>Локалізувати постер</TooltipContent>
						</Tooltip>
					</div>
				</Show>
			</Transition>
		),
		localized_poster_button,
	);
}
