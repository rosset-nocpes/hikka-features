import { createSignal } from "solid-js";
import Player, { getWatchData } from "./moon-player";
import { render } from "solid-js/web";

export default async function watchButton(anime_data, watchButtonLocation?) {
  const [playerDisabled, togglePlayerDisabled] = createSignal(true);

  let data: any;
  getWatchData(anime_data.slug)
    .then((x: any) => (data = x))
    .then((data: any) =>
      data !== null ? togglePlayerDisabled(!playerDisabled()) : null
    );

  render(
    () => (
      <button
        id="player-button"
        class="inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-secondary/60 bg-secondary/30 hover:bg-secondary/60 hover:text-secondary-foreground h-12 px-4 py-2"
        onClick={() => Player(data)}
        disabled={playerDisabled()}
      >
        <img src={browser.runtime.getURL("/hikka-features-mono.svg")} />
        Перегляд
      </button>
    ),
    watchButtonLocation ||
      document.querySelector(
        "body > main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div > div"
      )!
  );
}
