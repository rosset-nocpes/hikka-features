import { createSignal } from "solid-js";
import Player, { getWatchData } from "./moon-player";
import amanogawaButton, { checkAmanogawa } from "./amanogawa-button";

export default function Main(anime_data: { slug: any }) {
  const [playerDisabled, togglePlayerDisabled] = createSignal(true);
  const [amanogawaDisabled, toggleAmanogawaDisabled] = createSignal(true);

  let data: any;
  getWatchData(anime_data.slug)
    .then((x: any) => (data = x))
    .then((data: any) =>
      data !== null ? togglePlayerDisabled(!playerDisabled()) : null
    );

  checkAmanogawa(anime_data).then((x: any) =>
    x ? toggleAmanogawaDisabled(!amanogawaDisabled()) : null
  );

  return (
    <div
      id="buttons-block"
      class="hikka-features"
      style="display: flex;justify-content: center;align-items: center;margin-top: -20px;"
    >
      <button
        id="player-button"
        class="features-button"
        onClick={() => Player(data)}
        disabled={playerDisabled()}
        style="margin-right: 3px;border-radius: 10px 2px 2px 10px;"
      >
        {/* <div class={styles.player_button} style="color: white;"></div> */}
        <span class="tabler--movie"></span>
      </button>
      <button
        id="amanogawa-button"
        class="features-button"
        onClick={() => amanogawaButton(anime_data)}
        disabled={amanogawaDisabled()}
        style="border-radius: 2px 10px 10px 2px;margin-right: 3px;"
      >
        <span class="amanogawa-logo"></span>
      </button>
    </div>
  );
}
