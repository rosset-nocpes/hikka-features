import { Button } from "@/components/ui/button";
import HikkaLogoMono from "@/public/hikka-features-mono.svg";
import {
  createEffect,
  createResource,
  createSignal,
  Match,
  Switch,
} from "solid-js";
import { render } from "solid-js/web";
import { Transition } from "solid-transition-group";
import { ContentScriptContext } from "wxt/client";
import reader, { getReaderData } from "./reader";

export default async function readerButton(
  ctx: ContentScriptContext,
  slug: string,
  location?: Element
) {
  if (document.body.querySelectorAll("#reader-button").length !== 0) {
    return;
  }

  const [readerDisabled, setReaderDisabled] = createSignal(true);
  const [buttonState, setButtonState] = createSignal(
    await watchButtonState.getValue()
  );

  // -1 - loading; 0 - not found; 1 - found;
  const [state, setState] = createSignal(-1);

  watchButtonState.watch((state) => setButtonState(state));

  const [readerData] = createResource(slug, getReaderData);

  createEffect(() => {
    if (!readerData.loading) {
      if (readerData()) {
        setReaderDisabled(false);
        setState(1);
      } else if (readerData.error) {
        setState(0);
      }
    }
  });

  const dark = await darkMode.getValue();

  return createShadowRootUi(ctx, {
    name: "reader-button",
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
            {buttonState()! && (
              <Button
                variant="outline"
                id="reader-button"
                class={cn("w-full gap-2", dark ? "dark" : "")}
                onClick={async () => {
                  (await reader(ctx, readerData())).mount();
                  setReaderDisabled(true);
                }}
                disabled={readerDisabled()}
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
                      <a>Читати</a>
                    </Match>
                  </Switch>
                </Transition>
              </Button>
            )}
          </Transition>
        ),
        container
      );
    },
  });
}
