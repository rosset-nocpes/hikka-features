import { createSignal, Match, Switch } from "solid-js";
import { MountableElement, render } from "solid-js/web";
import HikkaLogoMono from "@/public/hikka-features-mono.svg";
import { Transition } from "solid-transition-group";
import Reader, { getReaderData } from "./reader";

export default async function readerButton(
  slug: string,
  location?: MountableElement
) {
  if (document.body.querySelectorAll("#reader-button").length !== 0) {
    return;
  }

  const [readerDisabled, toggleReaderDisabled] = createSignal(true);
  const [buttonState, setButtonState] = createSignal(
    await watchButtonState.getValue()
  );

  // -1 - loading; 0 - not found; 1 - found;
  const [state, setState] = createSignal(-1);

  watchButtonState.watch((state) => setButtonState(state));

  let data: any;
  getReaderData(slug)
    .then((x: any) => (data = x))
    .then((y: any) =>
      y !== null
        ? (toggleReaderDisabled(!readerDisabled()), setState(1))
        : setState(0)
    );

  render(
    () => (
      <Transition name="slide-fade">
        {buttonState()! && (
          <button
            id="reader-button"
            class="hikka-features inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-secondary/60 bg-secondary/30 hover:bg-secondary/60 hover:text-secondary-foreground h-12 px-4 py-2"
            onClick={() => Reader(data)}
            disabled={readerDisabled()}
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
                  <a>Читати</a>
                </Match>
              </Switch>
            </Transition>
          </button>
        )}
      </Transition>
    ),
    location ||
      document.querySelector(
        "body > main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div > div"
      )!
  );
}
