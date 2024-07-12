import { For, MountableElement, render } from "solid-js/web";
import HikkaFLogoSmall from "@/public/hikka-features-small.svg";
import { Transition } from "solid-transition-group";
import { createResource, createSignal, Show } from "solid-js";

interface Website {
  title: string;
  host: string;
  url?: string;
}

enum MediaEnum {
  Anime = "anime",
  Manga = "manga",
  Novel = "novel",
}

export default async function aniButtons(
  data: any,
  location?: MountableElement,
  smallerTitle?: boolean
) {
  if (document.body.querySelectorAll("#ani-buttons").length !== 0) {
    return;
  }

  const content_type: MediaType | InfoType = data.data_type;

  const contentTypeMap: Record<string, Record<string, string>> = {
    character: {
      al: "characters",
    },
    person: { mal: "people", al: "staff", ad: "creator" },
    novel: { mal: "manga", al: "manga" },
  };

  const isMedia = Object.keys(MediaEnum).includes(content_type);
  const isAnime = content_type === "anime";
  const title =
    data.title_ja || data.title_en || data.title_original || data.name_en;

  const hosts: Record<SourcesType, string> = {
    mal: "myanimelist.net",
    anilist: "anilist.co",
    anidb: "anidb.net",
    ann: "animenewsnetwork.com",
    wiki: "en.wikipedia.org",
    amanogawa: "amanogawa.space",
    mu: "mangaupdates.com",
  };

  const getUrl = (website: SourcesType) =>
    isMedia
      ? data.external.find((obj: any) => obj.url?.includes(hosts[website]))?.url
      : null;

  const searchUrls: Record<SourcesType, Website> = {
    mal: {
      title: "MyAnimeList",
      host: hosts.mal,
      url: `https://myanimelist.net/${
        contentTypeMap[content_type]?.mal || content_type
      }${data.mal_id ? `/${data.mal_id}` : `.php?q=${title}`}`,
    },
    anilist: {
      title: "AniList",
      host: hosts.anilist,
      url: `https://anilist.co/search/${
        contentTypeMap[content_type]?.al || content_type
      }?search=${title}&sort=SEARCH_MATCH`,
    },
    anidb: {
      title: "AniDB",
      host: hosts.anidb,
      url:
        getUrl("anidb") ??
        `https://anidb.net/${
          contentTypeMap[content_type]?.ad || content_type
        }/?adb.search=${
          ["person", "character"].includes(content_type) &&
          title.split(" ").length === 2
            ? `${title.split(" ")[1]} ${title.split(" ")[0]}`
            : title
        }&do.search=1`,
    },
    ann: {
      title: "ANN",
      host: hosts.ann,
      url:
        getUrl("ann") ?? `https://www.animenewsnetwork.com/search?q=${title}`,
    },
    wiki: {
      title: "Wikipedia",
      host: hosts.wiki,
      url:
        content_type !== "character"
          ? getUrl("wiki") ??
            `https://en.wikipedia.org/w/index.php?search=${title}`
          : null,
    },
    amanogawa: {
      title: "Amanogawa",
      host: hosts.amanogawa,
    },
    mu: {
      title: "MU",
      host: hosts.mu,
    },
  };

  const [blockState, setBlockState] = createSignal(
    await aniButtonsState.getValue()
  );

  const anime_links: Website[] = [
    searchUrls.mal,
    searchUrls.anilist,
    searchUrls.anidb,
    searchUrls.ann,
    searchUrls.wiki,
    searchUrls.amanogawa,
  ];

  let manga_links: Website[] = [
    searchUrls.mal,
    searchUrls.anilist,
    searchUrls.wiki,
    searchUrls.mu,
  ];

  const character_links: Website[] = [
    searchUrls.mal,
    searchUrls.anilist,
    searchUrls.anidb,
    searchUrls.ann,
    searchUrls.wiki,
  ];

  const people_links: Website[] = [
    searchUrls.mal,
    searchUrls.anilist,
    searchUrls.anidb,
    searchUrls.ann,
    searchUrls.wiki,
  ];

  const [muUrl] = createResource(title, getMangaupdatesURL);
  const [agawaUrl] = createResource(data, getAmanogawaURL);

  aniButtonsState.watch((state) => setBlockState(state));

  render(
    () => (
      <Transition name="slide-fade">
        <Show when={blockState()}>
          <div id="ani-buttons" class="hikka-features">
            <h3
              class={`scroll-m-20 font-display ${
                smallerTitle ? "text-lg" : "text-xl"
              } font-bold tracking-normal`}
            >
              Інші джерела
              <img src={HikkaFLogoSmall} style="width: 21px; height: 20px" />
            </h3>
            <div>
              <For
                each={
                  isAnime
                    ? anime_links
                    : content_type === "character"
                    ? character_links
                    : content_type === "person"
                    ? people_links
                    : manga_links
                }
              >
                {(elem) => (
                  <a
                    href={
                      elem.title === "MU"
                        ? muUrl()
                        : elem.title === "Amanogawa"
                        ? agawaUrl()
                        : elem.url
                    }
                    target="_blank"
                    class={cn(
                      elem.title === "MU"
                        ? muUrl.loading
                          ? "animate-pulse"
                          : muUrl() === undefined
                          ? "link-disabled"
                          : ""
                        : "",
                      elem.title === "Amanogawa"
                        ? agawaUrl.loading
                          ? "animate-pulse"
                          : agawaUrl() === undefined
                          ? "link-disabled"
                          : ""
                        : ""
                    )}
                  >
                    <img
                      style="width:16px;height:16px;margin-right:2px;"
                      src={`https://www.google.com/s2/favicons?domain=${elem.host}`}
                    />
                    {elem.title}
                  </a>
                )}
              </For>
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
