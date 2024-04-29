import globalCss from '../style.css';
/* eslint-disable no-undef */
// @name        Hikka x Watari
// @version     1.0.4
// @author      ~rosset-nocpes
// @description Додає відео з Ватарі на сторінку аніме Хікки

export default async function hikkaWatari(anime_data) {
  const watari_external = anime_data.external.find((obj) =>
    obj.url.includes('watari-anime.com'),
  );

  // Якщо його немає - зупиняємось
  if (watari_external == undefined) {
    return;
  }

  const player_button = document.getElementById('player-button');

  // Прибираємо кнопку плеєра
  player_button.disabled = true;

  const start_node = document.querySelector('.order-2');
  start_node.insertAdjacentHTML(
    'afterbegin',
    '<div id="player">Завантажуємо відео з Ватарі...</div>',
  );

  // Отримуємо ідентифікатор контенту з Watari
  const watari_id = watari_external.url.split('=')[1];

  // Отримуємо дані з Watari
  const watari_anime_teams = await (
    await fetch(`https://master.api.aniage.net/v2/anime/projects/${watari_id}`)
  ).json();

  // Список ідентифікаторів команд
  let team_ids = [];
  // Епізоди команд
  let team_episodes = {};

  // Отримуємо дані про команду та список епізодів від неї
  for (const team of watari_anime_teams) {
    const team_id = team.teamId;
    team_ids.push(team_id);

    const watari_team_episodes = await (
      await fetch(
        `https://master.api.aniage.net/anime/episodes?page=1&pageSize=100&volume=1&sortOrder=ASC&animeId=${watari_id}&teamId=${team_id}`,
      )
    ).json();
    team_episodes[team_id] = [];

    for (const episode of watari_team_episodes) {
      const episode_title = episode.title;

      // Дістаємо iframe, або будуємо посилання самі
      let iframe = episode.playPath;
      if (iframe == null) {
        iframe = `https://master.api.aniage.net/anime/episodes/embed/play/${episode.s3VideoSource.id}`;
      }

      team_episodes[team_id].push({
        title: episode_title == '.' ? null : episode_title,
        index: episode.episodeNum,
        iframe: iframe,
      });
    }

    // Якщо у команди немає завантажених епізодів - видаляємо її зі списку
    if (team_episodes[team_id].length == 0) {
      const remove_index = team_ids.indexOf(team_id);
      team_ids = team_ids
        .slice(0, remove_index)
        .concat(team_ids.slice(remove_index + 1));
    }
  }

  // Інформація про команди
  const watari_teams_info = await (
    await fetch(
      'https://master.api.aniage.net/anime/teams/by-ids?' +
        team_ids.map((id) => `ids=${id}`).join('&'),
    )
  ).json();
  let team_info = {};

  // Беремо ту, що нам потрібна
  for (const team of watari_teams_info) {
    team_info[team.id] = {
      name: team.name,
      logo: `https://image.aniage.net/main/${team.logo}`,
      team_id: team.id,
    };
  }

  // Дістаємо блок плеєра, який був створений вище
  const player = document.querySelector('#player');

  player.innerHTML = `
        <style>${globalCss}</style>
        <div x-data="{ team_id: '${team_ids[0]}', iframe: '${team_episodes[team_ids[0]][0].iframe}' }">
          <div class="team-selects">
            <select class="team-select" x-model="team_id">
              ${team_ids.map((options_team_id) => `<option value="${options_team_id}">${team_info[options_team_id].name}</option>`).join('')}
            </select>
            ${team_ids
              .map(
                (options_team_id_2) => `
              <select class="team-select" x-model="iframe" x-show="team_id === '${options_team_id_2}'">
                ${team_episodes[options_team_id_2].map(
                  (options_team_episode) => `
                  <option value="${options_team_episode.iframe}">Епізод #${options_team_episode.index} ${options_team_episode.title != null ? ' - ' + options_team_episode.title : ''}</option>
                `,
                )}
              </select>
            `,
              )
              .join('')}
          </div>
          ${team_ids
            .map(
              (options_team_id_2) => `
            <template class="player-block" x-if="team_id === '${options_team_id_2}'">
            <div style="width: 100%; height: 332px; position: relative;">
              <iframe x-bind:src="iframe" loading="lazy" style="border: medium; border-radius: 4px; position: absolute; top: 0px; left: 0px; height: 100%; width: 100%; animation: 0.5s cubic-bezier(.77,0,.18,1) 0s 1 slideInFromUp;" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen=""></iframe>
            </div>
          </template>
          `,
            )
            .join('')}
          <a href="https://watari-anime.com/watch?wid=${watari_id}" class="watari-link" target="_blank">
            <img src="https://rosset-nocpes.github.io/ua-badges/src/watari-dark.svg">
          </a>
        </div>
      `;
}
