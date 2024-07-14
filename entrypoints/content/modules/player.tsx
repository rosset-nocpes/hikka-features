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
import GlassMoonLogo from "@/assets/glass_moon_logo.jpg";
import AmanogawaLogo from "@/assets/amanogawa_logo.jpg";
import FanVoxUaLogo from "@/assets/fanvoxua_logo.jpg";
import InariDubLogo from "@/assets/inaridub_logo.jpg";
import FourUaLogo from "@/assets/4ua_logo.jpg";

const StudioLogos: Record<string, string> = {
  amanogawa: AmanogawaLogo,
  fanvoxua: FanVoxUaLogo,
  fanwoxua: FanVoxUaLogo,
  inaridub: InariDubLogo,
  "4ua": FourUaLogo,
  glassmoon: GlassMoonLogo,
};

export async function getWatchData(anime_data: any) {
  const watch_data = await (
    await fetch(`https://hikka-features.pp.ua/watch/${anime_data.slug}`)
  ).json();

  if (Object.keys(watch_data)[0] === "error") {
    return null;
  }

  let data: Record<PlayerSource, Record<string, any>> = {
    moon: {},
    ashdi: {},
  };

  // moon provider
  if (watch_data["moon"] !== undefined) {
    watch_data["moon"].episodes.forEach(
      (episode: { videos: any[]; episode: any }) => {
        episode.videos.forEach((video: { studio: any; video_url: any }) => {
          const studio = video.studio;
          if (!data["moon"][studio]) {
            data["moon"][studio] = [];
          }
          data["moon"][studio].push({
            episode: episode.episode,
            video_url: video.video_url,
          });
        });
      }
    );
  }

  // ashdi provider
  // TODO: season indetifier
  let season =
    parseInt(
      anime_data.title_ua.split(" ")[
        anime_data.title_ua.split(" ").indexOf("сезон") - 1
      ]
    ) ||
    parseInt(
      anime_data.title_ja.split(" ")[
        anime_data.title_ja.split(" ").indexOf("Part") + 1
      ]
    ) ||
    1;

  watch_data["ashdi"].forEach((elem: { title: string; folder: any }) => {
    if (elem.folder[season - 1] === undefined) {
      return;
    }
    elem.folder[season - 1]["folder"].forEach(
      (episode: { title: string; id: string }) => {
        const studio = elem.title.trimStart();
        if (!data["ashdi"][studio]) {
          data["ashdi"][studio] = [];
        }
        data["ashdi"][studio].push({
          episode: parseInt(episode.title.split(" ")[1]),
          video_url: `https://ashdi.vip/vod/${episode.id}`,
        });
      }
    );
  });
  console.log(data);

  return data;
}

export default async function Player(
  data: Record<PlayerSource, Record<string, any>>
) {
  if (document.body.querySelectorAll("#player-block").length !== 0) {
    return;
  }

  const getWatched = () =>
    parseInt(
      document.body.querySelector("div.rounded-lg.border:nth-child(2) h3")
        ?.firstChild?.nodeValue!
    );

  const playersAvaliable: PlayerSource[] = [];
  Object.keys(data["moon"]).length !== 0 ? playersAvaliable.push("moon") : null;
  Object.keys(data["ashdi"]).length !== 0
    ? playersAvaliable.push("ashdi")
    : null;
  const [playerProvider, setPlayerProvider] = createSignal(
    playersAvaliable.includes(await defaultPlayer.getValue())
      ? await defaultPlayer.getValue()
      : (await defaultPlayer.getValue()) === "moon"
      ? "ashdi"
      : "moon"
  );
  const [teamName, setTeamName] = createSignal(
    Object.keys(data[playerProvider()])[0]
  );
  const [teamEpisode, setTeamEpisode] = createSignal(
    data[playerProvider()][teamName()].find(
      (obj: any) => obj.episode == getWatched() + 1
    ) || data[playerProvider()][teamName()][0]
  );
  const [episodesData, setEpisodesData] = createSignal(
    data[playerProvider()][teamName()]
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

  const handleSelectTeam = (e: any) => {
    if (e) {
      setTeamName(e);
      setEpisodesData(data[playerProvider()][teamName()]);
      setTeamEpisode(
        data[playerProvider()][e].find(
          (obj: any) => obj.episode == getWatched() + 1
        ) || data[playerProvider()][e][0]
      );
    }
  };

  render(
    () => (
      <TransitionGroup name="vertical-slide-fade" appear={true}>
        <div class="team-selects">
          <Select
            value={playerProvider()}
            class="w-full"
            onChange={(player) => {
              setPlayerProvider(player);
              setTeamName(Object.keys(data[player])[0]);
              setEpisodesData(data[player][teamName()]);
              setTeamEpisode(
                data[player][teamName()].find(
                  (obj: any) => obj.episode == getWatched() + 1
                ) || data[player][teamName()][0]
              );
            }}
            placeholder="Оберіть плеєр…"
            options={playersAvaliable}
            itemComponent={(props) => (
              <SelectItem item={props.item}>
                {props.item.rawValue.toUpperCase()}
              </SelectItem>
            )}
          >
            <SelectTrigger
              aria-label="PlayerProvider"
              class="w-full focus:ring-0"
            >
              <SelectValue<string>>
                {(state) => state.selectedOption().toUpperCase()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent class="z-0" />
          </Select>
          <Select
            value={teamName()}
            class="w-full"
            onChange={handleSelectTeam}
            options={Object.keys(data[playerProvider()])}
            placeholder="Оберіть команду фандабу…"
            itemComponent={(props) => (
              <SelectItem item={props.item}>
                <div class="flex items-center gap-2">
                  {StudioLogos[
                    props.item.rawValue.replaceAll(" ", "").toLowerCase()
                  ] && (
                    <img
                      class="size-5"
                      style="border-radius: 3px"
                      src={
                        StudioLogos[
                          props.item.rawValue.replaceAll(" ", "").toLowerCase()
                        ]
                      }
                    />
                  )}
                  {props.item.rawValue}
                </div>
              </SelectItem>
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
            options={episodesData()}
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
