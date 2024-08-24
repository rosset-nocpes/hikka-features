import { For, MountableElement, render } from "solid-js/web";
import HikkaFLogoSmall from "@/public/hikka-features-small.svg";
import MaterialSymbolsSadTabRounded from "~icons/material-symbols/sad-tab-rounded";
import { createSignal, Resource, Show } from "solid-js";
import Disclosure from "@corvu/disclosure";
import { Button } from "@/components/ui/button";
import { Transition } from "solid-transition-group";
import { Image } from "@kobalte/core/image";

export default async function FandubBlock(
  getTeams: Resource<any>,
  location?: MountableElement,
  smallerTitle?: boolean
) {
  if (document.body.querySelectorAll("#teams-block").length !== 0) {
    return;
  }

  const [blockState, setBlockState] = createSignal(
    await fandubBlockState.getValue()
  );

  fandubBlockState.watch((state) => setBlockState(state));

  render(
    () => (
      <Transition name="slide-fade">
        <Show when={blockState()}>
          <div id="teams-block" class="hikka-features">
            <h3
              class={`scroll-m-20 font-display ${
                smallerTitle ? "text-lg" : "text-xl"
              } font-bold tracking-normal`}
            >
              Від команд
              <img src={HikkaFLogoSmall} style="width: 21px; height: 20px" />
            </h3>
            <div class="teams-items">
              <Show when={getTeams.loading}>
                <div class="skeleton animate-pulse h-10 bg-secondary/60" />
                <div class="skeleton animate-pulse h-10 bg-secondary/60" />
                <div class="skeleton animate-pulse h-10 bg-secondary/60" />
              </Show>
              <Show when={getTeams() && getTeams()["error"]}>
                <a class="text-muted-foreground cursor-default">
                  <Image>
                    <Image.Fallback>
                      <MaterialSymbolsSadTabRounded class="size-6" />
                    </Image.Fallback>
                  </Image>
                  Немає даних
                </a>
              </Show>
              <Show when={getTeams() && !getTeams()["error"]}>
                <div>
                  <Show when={getTeams()["fandub"].length > 3}>
                    <Disclosure collapseBehavior="hide">
                      {(props) => (
                        <>
                          <For each={getTeams()["fandub"].slice(0, 3)}>
                            {(team) => (
                              <a href={team.telegram} target="_blank">
                                <Image>
                                  <Image.Img
                                    loading="lazy"
                                    src={
                                      STUDIO_LOGOS[
                                        STUDIO_CORRECTED_NAMES[team.title]
                                          ? STUDIO_CORRECTED_NAMES[team.title]
                                              .replaceAll(" ", "")
                                              .toLowerCase()
                                          : team.title
                                              .replaceAll(" ", "")
                                              .toLowerCase()
                                      ] || team.icon
                                    }
                                  />
                                  <Image.Fallback>
                                    {team.title[0].toUpperCase()}
                                  </Image.Fallback>
                                </Image>
                                {STUDIO_CORRECTED_NAMES[team.title] ||
                                  team.title}
                              </a>
                            )}
                          </For>
                          <Disclosure.Content>
                            <For each={getTeams()["fandub"].slice(3)}>
                              {(team) => (
                                <a href={team.telegram} target="_blank">
                                  <Image>
                                    <Image.Img
                                      loading="lazy"
                                      src={
                                        STUDIO_LOGOS[
                                          STUDIO_CORRECTED_NAMES[team.title]
                                            ? STUDIO_CORRECTED_NAMES[team.title]
                                                .replaceAll(" ", "")
                                                .toLowerCase()
                                            : team.title
                                                .replaceAll(" ", "")
                                                .toLowerCase()
                                        ] || team.icon
                                      }
                                    />
                                    <Image.Fallback>
                                      {team.title[0].toUpperCase()}
                                    </Image.Fallback>
                                  </Image>
                                  {STUDIO_CORRECTED_NAMES[team.title] ||
                                    team.title}
                                </a>
                              )}
                            </For>
                          </Disclosure.Content>
                          <div class="footer">
                            <Disclosure.Trigger>
                              <Button variant="link" size="sm" class="p-0">
                                {props.expanded
                                  ? "Згорнути..."
                                  : "Показати більше..."}
                              </Button>
                            </Disclosure.Trigger>
                          </div>
                        </>
                      )}
                    </Disclosure>
                  </Show>
                  <Show when={getTeams()["fandub"].length <= 3}>
                    <For each={getTeams()["fandub"]}>
                      {(team) => (
                        <a href={team.telegram} target="_blank">
                          <Image>
                            <Image.Img
                              loading="lazy"
                              src={
                                STUDIO_LOGOS[
                                  STUDIO_CORRECTED_NAMES[team.title]
                                    ? STUDIO_CORRECTED_NAMES[team.title]
                                        .replaceAll(" ", "")
                                        .toLowerCase()
                                    : team.title
                                        .replaceAll(" ", "")
                                        .toLowerCase()
                                ] || team.icon
                              }
                            />
                            <Image.Fallback>
                              {team.title[0].toUpperCase()}
                            </Image.Fallback>
                          </Image>
                          {STUDIO_CORRECTED_NAMES[team.title] || team.title}
                        </a>
                      )}
                    </For>
                  </Show>
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </Transition>
    ),
    location ||
      document.querySelector(
        "body > main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div"
      )!
  );
}
