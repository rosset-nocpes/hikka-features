import { onNavigate } from '@violentmonkey/url';
import globalCss from './style.css';
import { stylesheet } from './style.module.css';
import { render } from 'solid-js/web';
import * as scripts from './scripts/index.js';
import { createSignal } from 'solid-js';
import { Transition } from 'solid-transition-group';

const [showSettings, toggleShowSettings] = createSignal(false);
const [showAniBackground, toggleAniBackground] = createSignal(true);
let url, previousCreatingEdit, previousAnimeSlug;

const aniBackState = GM_getValue('aniBackState');

!aniBackState ? GM_setValue('aniBackState', false) : '';

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

document.body.insertAdjacentHTML(
  'afterbegin',
  `<style>${[globalCss, stylesheet].join('\n')}</style>`,
);

onNavigate(async () => {
  // remove other scripts on change of page
  const u_char_button = document.getElementById('u-char-button');
  u_char_button ? u_char_button.remove() : null;

  const split_path = document.location.pathname.split('/');
  const path = split_path[1];

  // for anime page scripts
  if (split_path.length == 3 && path == 'anime') {
    const anime_slug = split_path[2];
    previousAnimeSlug = anime_slug;

    const anime_data = await (
      await fetch(`https://api.hikka.io/anime/${anime_slug}`)
    ).json();

    const info_block = document.querySelector(
      'body main > .grid > .flex:nth-child(2) > .grid > div:nth-child(3) > .flex',
    );

    // to use buttons, check the Main function
    toggleShowSettings(false);
    render(
      () =>
        scripts.Main(
          anime_data,
          scripts,
          globalCss,
          stylesheet,
          showSettings,
          toggleShowSettings,
        ),
      info_block,
    );
    settingsMenu();

    // aniButtons
    info_block.children[1].insertAdjacentHTML(
      'afterbegin',
      '<div id="ani-buttons" style="display: flex; justify-content: center;"></div>',
    );

    render(
      () => scripts.aniButtons(anime_data),
      info_block.children[1].firstChild,
    );

    // aniBackground
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
  } else if (split_path.length == 3 && path == 'edit') {
    const creatingEdit = isNaN(parseInt(split_path[2]));

    const edit_set = creatingEdit
      ? new URLSearchParams(document.location.search)
      : null;

    const edit_info = creatingEdit
      ? null
      : await (
          await fetch(`https://api.hikka.io/edit/${split_path[2]}`)
        ).json();

    const content_type = creatingEdit
      ? edit_set.get('content_type')
      : edit_info.content.data_type;

    const slug = creatingEdit ? edit_set.get('slug') : edit_info.content.slug;

    // ani-buttons on edit page
    const data = await (
      await fetch(
        `https://api.hikka.io/${content_type === 'character' ? 'characters' : content_type === 'person' ? 'people' : content_type}/${slug}`,
      )
    ).json();

    const info_block = creatingEdit
      ? document.querySelector('div.rounded-md:nth-child(2)')
      : document.querySelector('div.flex.flex-col.gap-4.rounded-md');

    info_block.insertAdjacentHTML(
      'afterbegin',
      '<div id="ani-buttons" style="display: flex; justify-content: center;"></div>',
    );

    render(
      () => scripts.aniButtons(data),
      document.getElementById('ani-buttons'),
    );

    if (!creatingEdit && content_type === 'character') {
      const [uCharDisabled, toggleUCharDisabled] = createSignal(true);
      render(
        () => (
          <button
            id="u-char-button"
            class="features-button"
            disabled={uCharDisabled()}
            onClick={() => window.open(url, '_self')}
          >
            <span class="tabler--circle-arrow-right-filled"></span>
          </button>
        ),
        document.querySelector('#breadcrumbs'),
      );

      !previousCreatingEdit
        ? (url = await scripts.UCharButton(slug, previousAnimeSlug))
        : null;
      url ? toggleUCharDisabled(!uCharDisabled()) : null;
    } else if (creatingEdit && content_type === 'character') {
      url = await scripts.UCharButton(slug, previousAnimeSlug);
    }

    console.log(previousAnimeSlug);

    previousCreatingEdit = creatingEdit;
  } else if (
    split_path.length == 3 &&
    path !== 'edit' &&
    path !== 'characters'
  ) {
    previousCreatingEdit = false;
    previousAnimeSlug = undefined;
  }
});
