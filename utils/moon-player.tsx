/* eslint-disable no-undef */
// @name        Hikka x MoonAnime
// @version     1.0.0
// @author      ~rosset-nocpes
// @description Додає відео з MoonAnime на сторінку аніме Хікки

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSignal, For } from "solid-js";
import { render } from "solid-js/web";

export async function getWatchData(anime_slug: string) {
  const moon_data = await (
    await fetch(`https://hikka-features.pp.ua/watch/${anime_slug}`)
  ).json();

  if (Object.keys(moon_data)[0] === "error") {
    return null;
  }

  const data: any = {};

  moon_data.episodes.forEach((episode: { videos: any[]; episode: any }) => {
    episode.videos.forEach((video: { studio: any; video_url: any }) => {
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

export default function Player(data: { [x: string]: any }) {
  const [teamName, setTeamName] = createSignal(Object.keys(data)[0]);
  const [teamEpisode, setTeamEpisode] = createSignal(data[teamName()][0]);

  const player_button = document.getElementById("player-button")!;

  // disabling player-button
  player_button.disabled = true;

  const start_node = document.querySelector(".order-2")!;
  start_node.insertAdjacentHTML("afterbegin", '<div id="player"></div>');
  const player = document.querySelector("#player")!;

  render(
    () => (
      <>
        <div class="team-selects">
          <Select
            value={teamName()}
            class="w-full"
            onChange={(e) => setTeamEpisode(data[e][0]) && setTeamName(e)}
            options={Object.keys(data)}
            placeholder="Оберіть команду фандабу…"
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
            )}
          >
            <SelectTrigger aria-label="Team" class="w-full">
              <SelectValue<string>>
                {(state) => state.selectedOption()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
          <Select
            value={teamEpisode()}
            class="w-full overflow-y-auto max-h-9"
            onChange={(e) => setTeamEpisode(e)}
            options={data[teamName()]}
            optionValue="video_url"
            optionTextValue="episode"
            placeholder="Оберіть епізод…"
            itemComponent={(props) => (
              <SelectItem item={props.item}>
                Епізод #{props.item.textValue}
              </SelectItem>
            )}
          >
            <SelectTrigger aria-label="Episode" class="w-full">
              <SelectValue<any>>
                {(state) =>
                  state.selectedOption() &&
                  "Епізод #" + state.selectedOption().episode
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent class="overflow-y-auto max-h-96" />
          </Select>
        </div>
        <div
          class="player-block"
          style="width: 100%; height: 332px; position: relative;"
        >
          <iframe
            src={`${
              (console.log(teamEpisode()), teamEpisode().video_url)
            }?site=hikka.io`}
            loading="lazy"
            style="border: medium; border-radius: 4px; position: absolute; top: 0px; left: 0px; height: 100%; width: 100%; animation: 0.5s cubic-bezier(.77,0,.18,1) 0s 1 slideInFromUp;"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowfullscreen
          ></iframe>
        </div>
      </>
    ),
    player
  );
}
