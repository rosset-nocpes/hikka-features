import { createSignal } from 'solid-js';

export default function Main(
  anime_data,
  scripts,
  globalCss,
  stylesheet,
  showSettings,
  toggleShowSettings,
) {
  const [watariDisabled, toggleWatariDisabled] = createSignal(true);
  const [amanogawaDisabled, toggleAmanogawaDisabled] = createSignal(true);

  scripts.checkWatari(anime_data)
    ? toggleWatariDisabled(!watariDisabled())
    : null;

  scripts
    .checkAmanogawa(anime_data)
    .then((x) => (x ? toggleAmanogawaDisabled(!amanogawaDisabled()) : null));

  return (
    <div
      id="buttons-block"
      class="hikka-features"
      style="display: flex;justify-content: center;align-items: center;margin-top: -20px;"
    >
      <button
        id="player-button"
        class="features-button"
        onClick={() => scripts.hikkaWatari(anime_data)}
        disabled={watariDisabled()}
        style="margin-right: 3px;border-radius: 10px 2px 2px 10px;"
      >
        {/* <div class={styles.player_button} style="color: white;"></div> */}
        <span class="tabler--movie"></span>
      </button>
      <button
        id="amanogawa-button"
        class="features-button"
        onClick={() => scripts.amanogawaButton(anime_data)}
        disabled={amanogawaDisabled()}
        style="border-radius: 2px 2px 2px 2px;margin-right: 3px;"
      >
        <span class="amanogawa-logo"></span>
      </button>
      <button
        id="settings"
        class="features-button"
        onClick={() => {
          toggleShowSettings(!showSettings());
        }}
        style="border-radius: 2px 10px 10px 2px;"
      >
        {/* <div class={styles.settings} style="color: white;"></div> */}
        <span class="tabler--settings"></span>
      </button>
    </div>
  );
}
