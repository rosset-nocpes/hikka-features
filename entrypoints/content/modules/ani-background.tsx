import { createSignal, onMount, Show } from "solid-js";
import { render } from "solid-js/web";
import { Transition } from "solid-transition-group";

export default async function aniBackground(mal_id: number, type: MediaType) {
  if (document.querySelectorAll("#cover").length !== 0) {
    return;
  }

  if (type === "novel") {
    type = "manga";
  }

  const anilist_url = "https://graphql.anilist.co";
  const banner_query = `
    query media($mal_id: Int, $type: MediaType) {
        Media(idMal: $mal_id, type: $type) {
          bannerImage
        }
    }
    `;

  const background_data = await (
    await fetch(anilist_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: banner_query,
        variables: {
          mal_id: mal_id,
          type: type.toUpperCase(),
        },
      }),
    })
  ).json();

  const banner = background_data.data.Media?.bannerImage;

  if (banner === undefined) {
    return null;
  }

  const [isLoaded, setIsLoaded] = createSignal(false);

  onMount(() => {
    const img = new Image();
    img.src = banner;

    img.onload = () => setIsLoaded(true);
  });

  const [stateBack, setAniBack] = createSignal(await aniBackState.getValue());

  aniBackState.watch((state) => setAniBack(state));

  render(
    () => (
      <Transition
        onEnter={(el, done) => {
          const a = el.animate([{ height: "0%" }, { height: "20rem" }], {
            duration: 500,
            easing: "cubic-bezier(0.77, 0, 0.18, 1)",
          });
          a.finished.then(done);
        }}
        onExit={(el, done) => {
          const a = el.animate([{ height: "20rem" }, { height: "0%" }], {
            duration: 500,
            easing: "cubic-bezier(0.77, 0, 0.18, 1)",
          });
          a.finished.then(done);
        }}
        appear={true}
      >
        <Show when={stateBack() && isLoaded()}>
          <div class="absolute left-0 top-0 -z-20 h-80 w-full overflow-hidden opacity-40">
            <img
              id="cover"
              alt="cover"
              fetchpriority="high"
              decoding="async"
              data-nimg="fill"
              class="opacity-1 !transition relative size-full object-cover gradient-mask-b-0"
              style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent"
              sizes="100vw"
              src={banner}
            />
          </div>
        </Show>
      </Transition>
    ),
    document.querySelector("body main > .grid")!
  );
}
