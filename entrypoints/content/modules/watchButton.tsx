import { createSignal, Match, Show, Switch } from "solid-js";
import Player, { getWatchData } from "./player";
import { MountableElement, render } from "solid-js/web";
import HikkaLogoMono from "@/public/hikka-features-mono.svg";
import { Transition } from "solid-transition-group";

export default async function watchButton(
  anime_data: any,
  watchButtonLocation?: MountableElement
) {
  if (document.body.querySelectorAll("#player-button").length !== 0) {
    return;
  }

  const [playerDisabled, togglePlayerDisabled] = createSignal(true);
  const [buttonState, setButtonState] = createSignal(
    await watchButtonState.getValue()
  );

  // -1 - loading; 0 - not found; 1 - found;
  const [state, setState] = createSignal(-1);

  watchButtonState.watch((state) => setButtonState(state));

  let data: any;
  getWatchData(anime_data)
    .then((x: any) => (data = x))
    .then((data: any) => {
      data !== null
        ? (togglePlayerDisabled(!playerDisabled()), setState(1))
        : setState(0);

      Player(data);
    });

  render(
    () => (
      <Transition name="slide-fade">
        <Show when={buttonState()}>
          <button
            id="player-button"
            class="hikka-features inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-secondary/60 bg-secondary/30 hover:bg-secondary/60 hover:text-secondary-foreground h-12 px-4 py-2"
            disabled={playerDisabled()}
          >
            <img src={HikkaLogoMono} />
            <Transition name="vertical-slide-fade" mode="outin">
              <Switch>
                <Match when={state() === -1}>
                  <a>Шукаю</a>
                </Match>
                <Match when={state() === 0}>
                  <a>Немає</a>
                </Match>
                <Match when={state() === 1}>
                  <a>Перегляд</a>
                </Match>
              </Switch>
            </Transition>
          </button>
        </Show>
      </Transition>
    ),
    watchButtonLocation ||
      document.querySelector(
        "body > main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div > div"
      )!
  );
}
