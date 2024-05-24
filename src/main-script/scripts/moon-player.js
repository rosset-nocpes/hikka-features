/* eslint-disable no-undef */
// @name        Hikka x MoonAnime
// @version     1.0.0
// @author      ~rosset-nocpes
// @description Додає відео з MoonAnime на сторінку аніме Хікки

import { createSignal, For } from 'solid-js';
import { render } from 'solid-js/web';

export async function getWatchData(anime_slug) {
  const moon_data = await (
    await fetch(`https://hikka-features.pp.ua/watch/${anime_slug}`)
  ).json();

  if (Object.keys(moon_data)[0] === 'error') {
    return null;
  }

  const data = {};

  moon_data.episodes.forEach((episode) => {
    episode.videos.forEach((video) => {
      const studio = video.studio;
      if (!data[studio]) {
        data[studio] = [];
      }
      data[studio].push({
        episode: episode.episode,
        video_url: video.video_url,
      });
    });
  });

  return data;
}

export default function Player(data) {
  const [teamName, setTeamName] = createSignal(Object.keys(data)[0]);
  const [teamEpisode, setTeamEpisode] = createSignal(
    data[teamName()][0].video_url,
  );

  const player_button = document.getElementById('player-button');

  // disabling player-button
  player_button.disabled = true;

  const start_node = document.querySelector('.order-2');
  start_node.insertAdjacentHTML('afterbegin', '<div id="player"></div>');
  const player = document.querySelector('#player');

  render(
    () => (
      <>
        <div class="team-selects">
          <select
            value={teamName()}
            onChange={(e) =>
              setTeamName(e.currentTarget.value) &&
              setTeamEpisode(data[e.currentTarget.value][0].video_url)
            }
            class="team-select"
          >
            <For each={Object.keys(data)}>
              {(elem) => <option value={elem}>{elem}</option>}
            </For>
          </select>
          <select
            value={teamEpisode()}
            onChange={(e) => setTeamEpisode(e.currentTarget.value)}
            class="team-select"
          >
            <For each={data[teamName()]}>
              {(episode) => (
                <option value={episode.video_url}>
                  Епізод #{episode.episode}
                </option>
              )}
            </For>
          </select>
        </div>
        <div
          class="player-block"
          style="width: 100%; height: 332px; position: relative;"
        >
          <iframe
            src={teamEpisode()}
            loading="lazy"
            style="border: medium; border-radius: 4px; position: absolute; top: 0px; left: 0px; height: 100%; width: 100%; animation: 0.5s cubic-bezier(.77,0,.18,1) 0s 1 slideInFromUp;"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowfullscreen
          ></iframe>
        </div>
      </>
    ),
    player,
  );
}
