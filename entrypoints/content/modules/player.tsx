import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEffect, createSignal, Show } from "solid-js";
import { render } from "solid-js/web";
import { Transition, TransitionGroup } from "solid-transition-group";

export async function getWatchData(anime_data: any) {
  const watch_data = await fetch(
    `${BACKEND_BRANCHES[await backendBranch.getValue()]}/watch/${
      anime_data.slug
    }`
  );

  if (!watch_data.ok) {
    return null;
  }

  return await watch_data.json();
}

export default async function Player(
  data: Record<PlayerData, any>,
  anime_data: any
) {
  if (document.body.querySelectorAll("#player").length !== 0) {
    return;
  }

  const getWatched = () =>
    parseInt(
      document.body.querySelector("div.rounded-lg.border:nth-child(2) h3")
        ?.firstChild?.nodeValue!
    );

  const playersAvaliable = Object.keys(data).filter((key) => key !== 'type') as PlayerSource[];

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

  const [getNextEpState, setNextEpState] = createSignal(false);

  const [getWatchedState, toggleWatchedState] = createSignal(false);

  const [getPlayerState, togglePlayerState] = createSignal(false);

  const [getRichPresence, setRichPresence] = createSignal(
    await richPresence.getValue()
  );

  richPresence.watch(setRichPresence);

  const player_button = document.getElementById(
    "player-button"
  )! as HTMLButtonElement;

  player_button.addEventListener("click", () => {
    player_button.classList.toggle("watch-button-toggled");
    togglePlayerState(!getPlayerState());
  });

  const start_node = document.querySelector(".order-2")!;
  start_node.insertAdjacentHTML(
    "afterbegin",
    '<div style="margin-bottom:-3rem" id="player"></div>'
  );
  const player = document.querySelector("#player")!;

  let duration = 0;
  let time = 0;

  window.addEventListener("message", function (event) {
    if (event.data.event === "time") {
      let message = event.data;
      duration = message.duration;
      time = message.time;

      // TODO: improve (need 5 second to watch for activation)
      if (time / duration > 0.88 && !getWatchedState()) {
        if (getWatched() + 1 === teamEpisode().episode) {
          (
            document.body.querySelector(
              "div.inline-flex:nth-child(2) button:nth-child(2)"
            ) as HTMLButtonElement
          )?.click();
          toggleWatchedState(true);
        }
      }
    } else if (
      event.data.event === "pause" &&
      time / duration > 0.8 &&
      getNextEpState() === false &&
      data[playerProvider()][teamName()].find(
        (obj: any) => obj.episode == teamEpisode().episode + 1
      )
    ) {
      setNextEpState(true);
    } else if (event.data.event === "play") {
      setNextEpState(false);
    }
  });

  let saved_desc_state = false;
  const [getRichPresenceCheck, setRichPresenceCheck] = createSignal<boolean>();
  browser.runtime.onMessage.addListener((response) => {
    if (
      response.type === "rich-presence-reply" &&
      response.action === "check"
    ) {
      setRichPresenceCheck(response.tabs_count === 1);
    }
  });

  createEffect(async () => {
    actionRichPresence("check");
    if (
      getPlayerState() &&
      getRichPresence() &&
      teamName() &&
      teamEpisode() &&
      getRichPresenceCheck()
    ) {
      if (!saved_desc_state) {
        let r = await userData.getValue();
        r!["description"] = (await getUserData())["description"];
        userData.setValue(r);
        saved_desc_state = true;
      }

      EditDesc(
        `Дивлюся ${teamEpisode()["episode"]} епізод аніме [${
          anime_data["title_ua"] ||
          anime_data["title_en"] ||
          anime_data["title_ja"]
        }](${`https://hikka.io/anime/${anime_data["slug"]}`}) в озвучці ${
          STUDIO_CORRECTED_NAMES[teamName()] || teamName()
        }`
      );
    } else if (saved_desc_state) {
      EditDesc((await userData.getValue())!["description"]);
      let r = await userData.getValue();
      delete r!["description"];
      userData.setValue(r);
      saved_desc_state = false;
    }
  });

  const handleSelectEpisode = (e: any) => {
    if (e) {
      setTeamEpisode(e);
      setNextEpState(false);
      toggleWatchedState(false);
    }
  };

  const handleSelectPlayer = (e: PlayerSource) => {
    if (e) {
      setPlayerProvider(e);
      setTeamName(Object.keys(data[e])[0]);
      setEpisodesData(data[e][teamName()]);
      setTeamEpisode(
        data[e][teamName()].find(
          (obj: any) => obj.episode == getWatched() + 1
        ) || data[e][teamName()][0]
      );
      setNextEpState(false);
      toggleWatchedState(false);
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
      setNextEpState(false);
      toggleWatchedState(false);
    }
  };

  render(
    () => (
      <TransitionGroup name="vertical-slide-fade-revert">
        <Show when={getPlayerState()}>
          <div class="team-selects">
            <Select
              value={playerProvider()}
              class="w-full"
              onChange={handleSelectPlayer}
              placeholder="Оберіть плеєр…"
              options={playersAvaliable}
              itemComponent={(props) => (
                <SelectItem item={props.item}>
                  {props.item.rawValue.toUpperCase()}
                </SelectItem>
              )}
            >
              <SelectTrigger aria-label="PlayerProvider" class="focus:ring-0">
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
                    {STUDIO_LOGOS[
                      STUDIO_CORRECTED_NAMES[props.item.rawValue]
                        ? STUDIO_CORRECTED_NAMES[props.item.rawValue]
                            .replaceAll(" ", "")
                            .toLowerCase()
                        : props.item.rawValue.replaceAll(" ", "").toLowerCase()
                    ] && (
                      <img
                        class="size-5"
                        style="border-radius: 3px"
                        src={
                          STUDIO_LOGOS[
                            STUDIO_CORRECTED_NAMES[props.item.rawValue]
                              ? STUDIO_CORRECTED_NAMES[props.item.rawValue]
                                  .replaceAll(" ", "")
                                  .toLowerCase()
                              : props.item.rawValue
                                  .replaceAll(" ", "")
                                  .toLowerCase()
                          ]
                        }
                      />
                    )}
                    {STUDIO_CORRECTED_NAMES[props.item.rawValue] ||
                      props.item.rawValue}
                  </div>
                </SelectItem>
              )}
            >
              <SelectTrigger aria-label="Team" class="focus:ring-0">
                <SelectValue<string>>
                  {(state) => (
                    <a class="text-left line-clamp-1">
                      {STUDIO_CORRECTED_NAMES[state.selectedOption()] ||
                        state.selectedOption()}
                    </a>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent class="z-0" />
            </Select>
            <Show when={data["type"] !== "movie"}>
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
                <SelectTrigger aria-label="Episode" class="focus:ring-0">
                  <SelectValue<any>>
                    {(state) =>
                      state.selectedOption() &&
                      "Епізод #" + state.selectedOption().episode
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent class="overflow-y-auto max-h-96 z-0" />
              </Select>
            </Show>
          </div>
          <div
            class="player-block"
            style="width: 100%; height: 332px; position: relative;"
          >
            <Transition name="vertical-slide-fade-revert">
              <Show when={getNextEpState()}>
                <Button
                  class="next-episode-button"
                  onClick={() => {
                    handleSelectEpisode(
                      data[playerProvider()][teamName()].find(
                        (obj: any) => obj.episode == teamEpisode().episode + 1
                      )
                    );
                    setNextEpState(false);
                  }}
                >
                  Наступний епізод
                </Button>
              </Show>
            </Transition>
            <iframe
              id="player-iframe"
              src={`${teamEpisode().video_url}?site=hikka.io`}
              loading="lazy"
              style="border-radius: 10px; position: absolute; top: 0px; left: 0px; height: 100%; width: 100%;"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowfullscreen
            ></iframe>
          </div>
          <div style="height:3rem" />
        </Show>
      </TransitionGroup>
    ),
    player
  );
}
