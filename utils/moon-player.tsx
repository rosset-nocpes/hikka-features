import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSignal, Show } from "solid-js";
import { render } from "solid-js/web";
import { TransitionGroup } from "solid-transition-group";

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
  if (document.body.querySelectorAll("#player-block").length !== 0) {
    return;
  }

  const getWatched = () =>
    parseInt(
      document.body.querySelector("div.rounded-lg.border:nth-child(2) h3")
        ?.firstChild?.nodeValue!
    );

  const [teamName, setTeamName] = createSignal(Object.keys(data)[0]);
  const [teamEpisode, setTeamEpisode] = createSignal(
    data[teamName()].find((obj) => obj.episode == getWatched() + 1) ||
      data[teamName()][0]
  );

  const player_button = document.getElementById(
    "player-button"
  )! as HTMLButtonElement;

  // disabling player-button
  player_button.disabled = true;

  const start_node = document.querySelector(".order-2")!;
  start_node.insertAdjacentHTML("afterbegin", '<div id="player"></div>');
  const player = document.querySelector("#player")!;

  window.addEventListener("message", function (event) {
    if (event.data.event === "time") {
      let message = event.data;
      const duration = message.duration;
      const time = message.time;

      if (
        time / duration > 0.85 &&
        getWatched() + 1 === teamEpisode().episode
      ) {
        console.log("clicked");
        (
          document.body.querySelector(
            "div.inline-flex:nth-child(2) button:nth-child(2)"
          ) as HTMLButtonElement
        )?.click();
      }
    }
  });

  const handleSelectEpisode = (e: any) => {
    if (e) {
      setTeamEpisode(e);
    }
  };

  render(
    () => (
      <TransitionGroup name="vertical-slide-fade" appear={true}>
        <div class="team-selects">
          <Select
            value={teamName()}
            class="w-full"
            onChange={(e) =>
              setTeamEpisode(
                data[e].find((obj) => obj.episode == getWatched() + 1) ||
                  data[e][0]
              ) && setTeamName(e)
            }
            options={Object.keys(data)}
            placeholder="Оберіть команду фандабу…"
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
            )}
          >
            <SelectTrigger aria-label="Team" class="w-full focus:ring-0">
              <SelectValue<string>>
                {(state) => state.selectedOption()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent class="z-0" />
          </Select>
          <Select
            value={teamEpisode()}
            class="w-full overflow-y-auto max-h-9"
            onChange={handleSelectEpisode}
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
            <SelectTrigger aria-label="Episode" class="w-full focus:ring-0">
              <SelectValue<any>>
                {(state) =>
                  state.selectedOption() &&
                  "Епізод #" + state.selectedOption().episode
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent class="overflow-y-auto max-h-96 z-0" />
          </Select>
        </div>
        <div
          class="player-block"
          style="width: 100%; height: 332px; position: relative;"
        >
          <iframe
            id="player-iframe"
            src={`${teamEpisode().video_url}?site=hikka.io`}
            loading="lazy"
            style="border-radius: 10px; position: absolute; top: 0px; left: 0px; height: 100%; width: 100%;"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowfullscreen
          ></iframe>
        </div>
      </TransitionGroup>
    ),
    player
  );
}
