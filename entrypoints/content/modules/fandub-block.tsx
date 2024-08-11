import { For, MountableElement, render } from "solid-js/web";
import HikkaFLogoSmall from "@/public/hikka-features-small.svg";
import Teams from "@/utils/notion-db";
import { createResource, Show } from "solid-js";
import Disclosure from "@corvu/disclosure";
import { Button } from "@/components/ui/button";

export default async function FandubBlock(
  anime_slug: string,
  location?: MountableElement,
  smallerTitle?: boolean
) {
  let [getTeams] = createResource(anime_slug, Teams);

  render(
    () => (
      <div id="teams-block">
        <h3
          class={`hikka-features scroll-m-20 font-display ${
            smallerTitle ? "text-lg" : "text-xl"
          } font-bold tracking-normal`}
        >
          Від команд
          <img src={HikkaFLogoSmall} style="width: 21px; height: 20px" />
        </h3>
        <div>
          <Show when={getTeams.loading}>
            <div class="animate-pulse h-10 rounded-md bg-secondary/60" />
            <div class="animate-pulse h-10 rounded-md bg-secondary/60" />
            <div class="animate-pulse h-10 rounded-md bg-secondary/60" />
          </Show>
          <Show when={getTeams() && getTeams()["error"]}>
            <a class="text-muted-foreground">Немає даних</a>
          </Show>
          <Show when={getTeams() && !getTeams()["error"]}>
            <div>
              <Show when={getTeams().length > 3}>
                <Disclosure collapseBehavior="hide">
                  {(props) => (
                    <>
                      <For each={getTeams().slice(0, 3)}>
                        {(team) => (
                          <a href={team.telegram} target="_blank">
                            <img src={team.icon} />
                            {team.title}
                          </a>
                        )}
                      </For>
                      <Disclosure.Content>
                        <For each={getTeams().slice(3)}>
                          {(team) => (
                            <a href={team.telegram} target="_blank">
                              <img src={team.icon} />
                              {team.title}
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
              <Show when={getTeams().length <= 3}>
                <For each={getTeams()}>
                  {(team) => (
                    <a href={team.telegram} target="_blank">
                      <img src={team.icon} />
                      {team.title}
                    </a>
                  )}
                </For>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    ),
    location ||
      document.querySelector(
        "body > main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div"
      )!
  );
}
