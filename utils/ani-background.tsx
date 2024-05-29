import { createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";
import { Transition } from "solid-transition-group";

/* eslint-disable no-undef */
// @name        AniBackground
// @version     1.0.0
// @author      ~rosset-nocpes
// @description Adds background

export default async function aniBackground(
  mal_id: number,
  showAniBackground: () => any
) {
  const anilist_url = "https://graphql.anilist.co";
  const id_query = `
    query media($mal_id: Int, $type: MediaType) {
        Media(idMal: $mal_id, type: $type) {
            id
        }
    }
    `;

  const banner_query = `
    query media($id: Int, $type: MediaType) {
        Media(id: $id, type: $type) {
          bannerImage
        }
    }      
    `;

  const id_data = await (
    await fetch(anilist_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: id_query,
        variables: {
          mal_id: mal_id,
          type: "ANIME",
        },
      }),
    })
  ).json();

  const anilist_id = id_data["data"]["Media"]["id"];

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
          id: anilist_id,
          type: "ANIME",
        },
      }),
    })
  ).json();

  const banner = background_data["data"]["Media"]["bannerImage"];

  const [isLoaded, setIsLoaded] = createSignal(false);

  onMount(() => {
    const img = new Image();
    img.src = banner;

    img.onload = () => setIsLoaded(true);
  });

  render(
    () => (
      <div class="absolute left-0 top-0 -z-20 h-80 w-full overflow-hidden opacity-40">
        <Transition name="slide">
          {showAniBackground() && isLoaded() && (
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
          )}
        </Transition>
      </div>
    ),
    document.querySelector("body main > .grid")!
  );
}
