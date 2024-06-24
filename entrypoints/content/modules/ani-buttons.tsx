import { For, MountableElement, render } from "solid-js/web";
import HikkaFLogoSmall from "@/public/hikka-features-small.svg";
import { Transition } from "solid-transition-group";
import { createSignal } from "solid-js";

interface Website {
  hidden: boolean;
  title: string;
  host: string;
  url: string;
}

export default async function aniButtons(
  data,
  location?: MountableElement,
  smallerTitle?: boolean
) {
  if (document.body.querySelectorAll("#ani-buttons").length !== 0) {
    return;
  }

  const content_type = data.data_type;

  const contentTypeMap = {
    character: {
      al: "characters",
    },
    person: { mal: "people", al: "staff", ad: "creator" },
    novel: { mal: "manga", al: "manga" },
  };

  const isMedia = Object.values(MediaType).includes(content_type);
  const isAnime = content_type === MediaType.Anime;
  const isReadable =
    !isAnime && !Object.values(InfoType).includes(content_type);
  const title = isMedia
    ? data.title_ja || data.title_en || data.title_original
    : data.name_en;

  const hosts = {
    mal: "myanimelist.net",
    al: "anilist.co",
    ad: "anidb.net",
    ann: "animenewsnetwork.com",
    wiki: "en.wikipedia.org",
    agawa: "amanogawa.space",
    mu: "mangaupdates.com",
    denki: "dengeki.one",
  };

  const getUrl = (website) =>
    isMedia
      ? data.external.find((obj) => obj.url?.includes(hosts[website]))?.url
      : null;

  const searchUrls: Website[] = [
    {
      hidden: true,
      title: "MyAnimeList",
      host: hosts.mal,
      url: isMedia
        ? `https://myanimelist.net/anime/${data.mal_id}`
        : `https://myanimelist.net/${
            contentTypeMap[content_type]?.mal || content_type
          }/${data.mal_id}`,
    },
    {
      hidden: true,
      title: "AniList",
      host: hosts.al,
      url: `https://anilist.co/search/${
        contentTypeMap[content_type]?.al || content_type
      }?search=${title}&sort=SEARCH_MATCH`,
    },
    {
      hidden: isAnime || Object.values(InfoType).includes(content_type),
      title: "AniDB",
      host: hosts.ad,
      url:
        getUrl("ad") ??
        `https://anidb.net/${
          contentTypeMap[content_type]?.ad || content_type
        }/?adb.search=${
          ["person", "character"].includes(content_type) &&
          title.split(" ").length === 2
            ? `${title.split(" ")[1]} ${title.split(" ")[0]}`
            : title
        }&do.search=1`,
    },
    {
      hidden: isAnime || Object.values(InfoType).includes(content_type),
      title: "ANN",
      host: hosts.ann,
      url:
        getUrl("ann") ?? `https://www.animenewsnetwork.com/search?q=${title}`,
    },
    {
      hidden: content_type !== InfoType.Character,
      title: "Wikipedia",
      host: hosts.wiki,
      url:
        content_type !== "character"
          ? getUrl("wiki") ??
            `https://en.wikipedia.org/w/index.php?search=${title}`
          : null,
    },
    {
      hidden: isAnime,
      title: "Amanogawa",
      host: hosts.agawa,
      url: await getAmanogawaURL(data),
    },
    {
      hidden: isReadable,
      title: "MU",
      host: hosts.mu,
      url: await getMangaupdatesURL(title),
    },
  ];

  const [blockState, setBlockState] = createSignal(
    await aniButtonsState.getValue()
  );

  aniButtonsState.watch((state) => setBlockState(state));

  render(
    () => (
      <Transition name="slide-fade">
        {blockState()! && (
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
              <For each={searchUrls}>
                {(elem) =>
                  elem.hidden && (
                    <a
                      class={elem.url ?? "link-disabled"}
                      href={elem.url}
                      target="_blank"
                    >
                      <img
                        style="width:16px;height:16px;margin-right:2px;"
                        src={`https://www.google.com/s2/favicons?domain=${elem.host}`}
                      />
                      {elem.title}
                    </a>
                  )
                }
              </For>
            </div>
          </div>
        )}
      </Transition>
    ),
    location ||
      document.querySelector(
        "body > main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div"
      )!
  );
}
