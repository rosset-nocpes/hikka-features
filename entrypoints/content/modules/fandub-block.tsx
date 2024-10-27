import { Button } from "@/components/ui/button";
import HFxCPRBadge from "@/public/hf-x-cpr.svg";
import Disclosure from "@corvu/disclosure";
import { Image } from "@kobalte/core/image";
import { createSignal, Resource, Show } from "solid-js";
import { For, render } from "solid-js/web";
import { Transition } from "solid-transition-group";
import { ContentScriptContext } from "wxt/client";
import MaterialSymbolsSadTabRounded from "~icons/material-symbols/sad-tab-rounded";

export default async function fandubBlock(
  ctx: ContentScriptContext,
  getTeams: Resource<any>,
  location?: Element,
  smallerTitle?: boolean
) {
  if (document.body.querySelectorAll("#teams-block").length !== 0) {
    return;
  }

  const [blockState, setBlockState] = createSignal(
    await fandubBlockState.getValue()
  );

  fandubBlockState.watch((state) => setBlockState(state));

  const dark = await darkMode.getValue();

  return createShadowRootUi(ctx, {
    name: "fandub-block",
    position: "inline",
    append: "last",
    anchor:
      location ||
      document.querySelector(
        "body > main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div"
      )!,
    onMount(container) {
      render(
        () => (
          <Transition name="slide-fade">
            <Show when={blockState()}>
              <div id="teams-block" class={dark ? "dark" : ""}>
                <h3
                  class={`scroll-m-20 font-display ${
                    smallerTitle ? "text-lg" : "text-xl"
                  } font-bold tracking-normal`}
                >
                  Від команд
                  <a
                    href="https://cprcatalog.notion.site/65526ba93733463aa6c6bcf588cd9682"
                    target="_blank"
                  >
                    <img src={HFxCPRBadge} style="height: 20px" />
                  </a>
                </h3>
                <div class="teams-items">
                  <Show when={getTeams.loading}>
                    <div class="skeleton animate-pulse h-10 bg-secondary/60" />
                    <div class="skeleton animate-pulse h-10 bg-secondary/60" />
                    <div class="skeleton animate-pulse h-10 bg-secondary/60" />
                  </Show>
                  <Show
                    when={
                      (getTeams() && getTeams()["error"]) ||
                      (getTeams() && !getTeams()["fandub"])
                    }
                  >
                    <a class="text-muted-foreground cursor-default">
                      <Image>
                        <Image.Fallback>
                          <MaterialSymbolsSadTabRounded class="size-6" />
                        </Image.Fallback>
                      </Image>
                      Немає даних
                    </a>
                  </Show>
                  <Show
                    when={
                      getTeams() && !getTeams()["error"] && getTeams()["fandub"]
                    }
                  >
                    <div>
                      <Show when={getTeams()["fandub"].length > 3}>
                        <Disclosure collapseBehavior="hide">
                          {(props) => (
                            <>
                              <For each={getTeams()["fandub"].slice(0, 3)}>
                                {(team) => (
                                  <a href={team.link} target="_blank">
                                    <Image>
                                      <Image.Img
                                        loading="lazy"
                                        src={
                                          STUDIO_LOGOS[
                                            STUDIO_CORRECTED_NAMES[team.title]
                                              ? STUDIO_CORRECTED_NAMES[
                                                  team.title
                                                ]
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
                                    <a href={team.link} target="_blank">
                                      <Image>
                                        <Image.Img
                                          loading="lazy"
                                          src={
                                            STUDIO_LOGOS[
                                              STUDIO_CORRECTED_NAMES[team.title]
                                                ? STUDIO_CORRECTED_NAMES[
                                                    team.title
                                                  ]
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
                            <a href={team.link} target="_blank">
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
        container
      );
    },
  });
}
