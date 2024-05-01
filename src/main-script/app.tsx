import { onNavigate } from '@violentmonkey/url';
import globalCss from './style.css';
import styles, { stylesheet } from './style.module.css';
import { render } from 'solid-js/web';
import * as scripts from './scripts/index.js';
import { createSignal } from 'solid-js';
import { Transition } from 'solid-transition-group';

const [showSettings, toggleShowSettings] = createSignal(false);
const [showAniBackground, toggleAniBackground] = createSignal(true);

const aniBackState = GM_getValue('aniBackState');

!aniBackState ? GM_setValue('aniBackState', false) : '';

function Main(anime_data) {
  let watariState = scripts.checkWatari(anime_data);
  const amanogawaState = false;

  // TODO: dynamic check for availability on Amanogawa
  // const amanogawaState = scripts.checkAmanogawa(anime_data);

  return (
    <div
      id="buttons-block"
      style="display: flex;justify-content: center;align-items: center;margin-top: -20px;"
    >
      <style>{[globalCss, stylesheet].join('\n')}</style>
      <button
        id="player-button"
        onClick={() => scripts.hikkaWatari(anime_data)}
        onLoad={() => (watariState = scripts.checkWatari(anime_data))}
        disabled={watariState}
        style="margin-right: 3px;border-radius: 10px 2px 2px 10px;"
      >
        <div class={styles.player_button} style="color: gray;"></div>
      </button>
      <button
        id="amanogawa-button"
        onClick={() => scripts.amanogawaButton(anime_data)}
        disabled={amanogawaState}
        style="border-radius: 2px 2px 2px 2px;margin-right: 3px;"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="31"
          height="25"
          fill="none"
          viewBox="0 0 31 25"
        >
          <path
            fill="gray"
            d="M23.704 11.292a3.21 3.21 0 00-.124-.502c-.449-1.33-1.366-2.37-2.605-3.031a9.82 9.82 0 00-2.674-.961 10.967 10.967 0 00-2.712-.195c-.913.041-1.748.23-2.61.493-.216.066-.411.155-.617.239-.103.041-.203.09-.301.138-.098.048-.194.094-.287.146-.377.208-.752.41-1.105.656-.709.493-1.366 1.01-1.969 1.637a12.103 12.103 0 00-1.599 2.036c-.467.753-.836 1.55-1.114 2.415a7.16 7.16 0 00-.29 1.369c-.057.484-.056.998.032 1.51a3.062 3.062 0 00.78 1.584c.211.222.484.424.75.564.266.139.567.247.84.302.547.109 1.103.12 1.626.037.522-.082 1-.213 1.456-.416a7.748 7.748 0 002.36-1.608c.257-.251.191-.592-.016-.878-.207-.285-.738-.182-.87-.084l-.034.026c-.636.548-1.282.975-2.029 1.29a4.747 4.747 0 01-1.143.311c-.379.055-.762.056-1.108-.02-.346-.076-.605-.19-.846-.429-.24-.238-.34-.494-.41-.84a3.873 3.873 0 01-.033-1.109c.037-.374.11-.767.225-1.141.232-.748.554-1.47.963-2.142.41-.671.886-1.281 1.426-1.85a11.58 11.58 0 011.775-1.499 10.998 10.998 0 011.257-.734c.081-.04.166-.083.255-.12.179-.076.338-.154.533-.212a9.947 9.947 0 014.673-.307 7.737 7.737 0 012.305.783c4.19 2.195 1.52 7.302-.637 9.971-1.211 1.5-2.627 2.76-4.312 3.704-.375.21-.769.393-1.167.567a13.48 13.48 0 01-1.218.47c-.833.272-1.669.512-2.537.656-.868.144-1.74.228-2.624.211a10.223 10.223 0 01-2.616-.364 6.43 6.43 0 01-2.323-1.187 4.021 4.021 0 01-.851-.974 4.01 4.01 0 01-.518-1.182 8.191 8.191 0 01-.23-2.601c.06-.873.202-1.74.436-2.57a20.271 20.271 0 011.986-4.696c.855-1.472 1.861-2.743 3.029-3.95.584-.604 1.215-1.102 1.863-1.622a46.435 46.435 0 011.978-1.51s-.01.01.004-.003c.019-.018.049-.065.024-.108s-.08-.072-.129-.053c-.4.157-.782.347-1.154.557-.37.21-.724.43-1.077.665a12.78 12.78 0 00-1.987 1.596 21.81 21.81 0 00-3.155 4.047c-.452.748-.84 1.519-1.19 2.336-.35.816-.65 1.642-.883 2.524a13.71 13.71 0 00-.454 2.714c-.056.944.019 1.91.27 2.852.126.47.342.959.614 1.377.273.418.62.827 1.006 1.137a7.241 7.241 0 002.61 1.32c.938.26 1.86.362 2.8.374.94.013 1.84-.08 2.744-.243.903-.163 1.769-.394 2.621-.7.852-.305 1.682-.638 2.462-1.086a16.814 16.814 0 004.102-3.294c1.174-1.288 2.16-2.838 2.892-4.42.535-1.156 1.076-2.659.861-3.973zM16.892 3.038a.117.117 0 01.012.109l-.472 1.201a.118.118 0 00.141.157l1.24-.357a.12.12 0 01.109.022l.996.82a.118.118 0 00.193-.087l.045-1.29a.118.118 0 01.054-.094l1.087-.695a.118.118 0 00-.023-.21l-1.212-.44a.12.12 0 01-.074-.081l-.324-1.25a.118.118 0 00-.207-.042l-.794 1.016a.117.117 0 01-.1.045l-1.288-.078a.118.118 0 00-.105.184l.722 1.07zM21.044 5.533l1.473.13a.135.135 0 01.105.068l.728 1.287c.055.098.197.09.241-.014l.579-1.36a.135.135 0 01.097-.08l1.449-.295a.135.135 0 00.062-.234l-1.116-.97a.134.134 0 01-.046-.117l.168-1.47a.135.135 0 00-.204-.13l-1.268.76a.134.134 0 01-.126.008l-1.345-.614a.135.135 0 00-.188.153l.332 1.44a.136.136 0 01-.032.122l-1 1.09a.137.137 0 00.09.226zM24.793 8.82L26.2 9.7a.15.15 0 01.07.121l.075 1.657c.006.125.153.19.249.108l1.27-1.066a.153.153 0 01.137-.03l1.598.44a.152.152 0 00.181-.202l-.623-1.537a.151.151 0 01.014-.14l.914-1.384a.151.151 0 00-.136-.235l-1.655.117a.15.15 0 01-.128-.057l-1.034-1.296a.152.152 0 00-.266.058l-.4 1.61a.15.15 0 01-.094.104l-1.552.583a.152.152 0 00-.027.27zM22.626 22.028l-.829.125a.075.075 0 01-.067-.023l-.573-.612a.077.077 0 00-.131.04l-.138.827a.076.076 0 01-.043.057l-.76.356a.076.076 0 00-.002.136l.744.386a.079.079 0 01.041.06l.104.832c.008.062.085.09.13.044l.597-.588a.078.078 0 01.068-.021l.823.158a.077.077 0 00.083-.11l-.375-.749a.077.077 0 01.001-.07l.405-.735a.076.076 0 00-.078-.113zM25.975 20.08a.111.111 0 01-.03-.098l.216-1.193a.11.11 0 00-.16-.118l-1.078.554a.11.11 0 01-.102 0l-1.068-.575a.11.11 0 00-.162.115l.194 1.197a.109.109 0 01-.033.098l-.876.837a.111.111 0 00.06.19l1.197.185a.114.114 0 01.083.06l.526 1.092a.11.11 0 00.198.002l.547-1.081a.11.11 0 01.084-.06l1.2-.163a.11.11 0 00.063-.187l-.859-.856zM30.585 14.619l-1.799-.58a.177.177 0 01-.113-.115l-.541-1.813a.173.173 0 00-.306-.052l-1.108 1.532a.17.17 0 01-.144.071l-1.891-.045a.173.173 0 00-.144.275l1.115 1.527a.17.17 0 01.023.159l-.627 1.784a.173.173 0 00.217.222l1.797-.588a.172.172 0 01.159.027l1.502 1.147a.173.173 0 00.278-.137l-.004-1.891c0-.057.028-.11.075-.143l1.555-1.075a.172.172 0 00-.044-.305z"
          ></path>
          <path
            fill="gray"
            d="M12.524 3.587a.086.086 0 01.034.073l-.05.956a.088.088 0 00.137.077l.788-.542a.09.09 0 01.08-.01l.894.343a.087.087 0 00.115-.107l-.272-.918a.089.089 0 01.016-.08l.602-.744a.088.088 0 00-.066-.143l-.957-.025a.088.088 0 01-.07-.04l-.523-.802a.087.087 0 00-.155.018l-.32.902a.087.087 0 01-.06.055l-.924.248a.088.088 0 00-.03.154l.76.585z"
          ></path>
        </svg>
      </button>
      <button
        id="settings"
        onClick={() => {
          toggleShowSettings(!showSettings());
        }}
        style="border-radius: 2px 10px 10px 2px;"
      >
        <div class={styles.settings} style="color: gray;"></div>
      </button>
    </div>
  );
}

function settingsMenu() {
  const settings_menu = document.querySelector('.order-1 > div:nth-child(1)');

  render(
    () => (
      <Transition name="slide-fade">
        {showSettings() && (
          <div
            id="settings-menu"
            style="background: #0e0c10;border-width: 1px;border-radius: 10px;padding: 10px;"
          >
            <label id="optionSetting">
              <input
                id="aniBToggle"
                type="checkbox"
                checked={aniBackState}
                onClick={() => {
                  GM_getValue('aniBackState') == false
                    ? GM_setValue('aniBackState', true)
                    : GM_setValue('aniBackState', false);
                  toggleAniBackground(!showAniBackground());
                }}
              />
              AniBackground (Experimantal)
            </label>
          </div>
        )}
      </Transition>
    ),
    settings_menu,
  );
}

onNavigate(async () => {
  const split_path = document.location.pathname.split('/');

  const path = split_path[1];

  // for anime page scripts
  if (split_path.length == 3 && path == 'anime') {
    const anime_slug = split_path[2];

    const anime_data = await (
      await fetch(`https://api.hikka.io/anime/${anime_slug}`)
    ).json();

    const info_block = document.querySelector(
      'body main > .grid > .flex:nth-child(2) > .grid > div:nth-child(3) > .flex',
    );

    // to use buttons, check the Main function
    toggleShowSettings(false);
    render(() => Main(anime_data), info_block);
    settingsMenu();

    // aniButtons
    info_block.children[1].insertAdjacentHTML(
      'afterbegin',
      '<div id="ani-buttons" style="display: flex; justify-content: center;"></div>',
    );

    render(
      () => scripts.aniButtons(anime_data),
      info_block.children[1].children[0],
    );

    // aniBackground
    // TODO: make dynamic toggle
    const visibility = GM_getValue('aniBackState') ? 'initial' : 'none';

    const title = anime_data.title_ja;
    const kitsuData = await (
      await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${title}`)
    ).json();

    const background = document.querySelector('body main > .grid');
    background.insertAdjacentHTML(
      'afterbegin',
      `<div style="display: ${visibility};" class="absolute left-0 top-0 -z-20 h-80 w-full overflow-hidden opacity-40"></div>`,
    );

    render(
      () => scripts.aniBackground(kitsuData, showAniBackground),
      background.firstChild,
    );
  }
});
