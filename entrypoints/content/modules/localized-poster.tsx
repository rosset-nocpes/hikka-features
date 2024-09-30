import { Accessor, createEffect, createSignal, Resource, Show } from "solid-js";
import { render } from "solid-js/web";
import { Transition } from "solid-transition-group";

export default async function localizedPoster(
  getNotionData: Resource<any>,
  poster_state: Accessor<boolean>
) {
  if (document.body.querySelectorAll("#localized-poster").length !== 0) {
    return;
  }

  const start_node = document.querySelector("div.top-0:nth-child(1)")!;
  start_node.insertAdjacentHTML(
    "afterbegin",
    '<div id="localized-poster" class="absolute h-full"></div>'
  );
  const localized_poster = document.querySelector("#localized-poster")!;

  const [isLoaded, setIsLoaded] = createSignal(false);

  createEffect(() => {
    if (getNotionData() && getNotionData()["poster"]) {
      const img = new Image();
      img.src = getNotionData()["poster"];

      img.onload = () => setIsLoaded(true);
    }
  });

  render(
    () => (
      <Transition
        onEnter={(el, done) => {
          const a = el.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 500,
            easing: "cubic-bezier(0.77, 0, 0.18, 1)",
          });
          a.finished.then(done);
        }}
        onExit={(el, done) => {
          const a = el.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 500,
            easing: "cubic-bezier(0.77, 0, 0.18, 1)",
          });
          a.finished.then(done);
        }}
        appear
      >
        <Show when={poster_state() && isLoaded()}>
          <img
            alt="Localized Poster"
            width="150"
            height="225"
            decoding="async"
            class="opacity-100 !transition size-full object-cover"
            style={{ color: "transparent" }}
            src={getNotionData() && getNotionData()["poster"]}
          />
        </Show>
      </Transition>
    ),
    localized_poster
  );
}
