import { Button } from "@/components/ui/button";
import HikkaLogoMono from "@/public/hikka-features-mono.svg";
import { createSignal, Match, Show, Switch } from "solid-js";
import { render } from "solid-js/web";
import { Transition } from "solid-transition-group";
import { ContentScriptContext } from "wxt/client";
import Player, { getWatchData } from "./player";

export default async function watchButton(
  ctx: ContentScriptContext,
  anime_data: any,
  location?: Element
) {
  if (document.body.querySelectorAll("#player-button").length !== 0) {
    return;
  }

  const [playerDisabled, togglePlayerDisabled] = createSignal(true);
  const [buttonState, setButtonState] = createSignal(
    await watchButtonState.getValue()
  );

  const [playerState, togglePlayerState] = createSignal(false);

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

      Player(ctx, data, anime_data, playerState).then((x) => x!.mount());
    });

  const dark = await darkMode.getValue();

  return createShadowRootUi(ctx, {
    name: "watch-button",
    position: "inline",
    append: "last",
    anchor:
      location ||
      document.querySelector(
        "body > main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div > div"
      )!,
    onMount(container) {
      render(
        () => (
          <Transition
            onEnter={(el, done) => {
              const a = el.animate(
                [
                  { transform: "translateX(10px)", opacity: 0 },
                  { transform: "translateX(0px)", opacity: 1 },
                ],
                {
                  duration: 300,
                  easing: "ease",
                }
              );
              a.finished.then(done);
            }}
            onExit={(el, done) => {
              const a = el.animate(
                [
                  { transform: "translateX(0px)", opacity: 1 },
                  { transform: "translateX(10px)", opacity: 0 },
                ],
                {
                  duration: 100,
                  easing: "cubic-bezier(1, 0.5, 0.8, 1)",
                }
              );
              a.finished.then(done);
            }}
          >
            <Show when={buttonState()}>
              <Button
                variant="outline"
                id="player-button"
                class={cn("w-full gap-2", dark ? "dark" : "")}
                onClick={() => togglePlayerState(!playerState())}
                disabled={playerDisabled()}
              >
                <img src={HikkaLogoMono} class={!dark ? "invert" : ""} />
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
              </Button>
            </Show>
          </Transition>
        ),
        container
      );
    },
  });
}
