import { For, MountableElement, render } from "solid-js/web";
import getAmanogawaURL from "./amanogawa-button";
import HikkaFLogoSmall from "@/public/hikka-features-small.svg";

export default async function aniButtons(
  data,
  location: MountableElement,
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
  };

  const isAnime = content_type === "anime";
  const title = isAnime ? data.title_ja : data.name_en;

  const hosts = {
    mal: "myanimelist.net",
    al: "anilist.co",
    ad: "anidb.net",
    ann: "animenewsnetwork.com",
    wiki: "en.wikipedia.org",
    agawa: "amanogawa.space",
  };

  const getUrl = (website) =>
    isAnime
      ? data.external.find((obj) => obj.url?.includes(hosts[website]))?.url
      : null;

  const searchUrls = [
    {
      title: "MyAnimeList",
      host: hosts.mal,
      url: isAnime
        ? `https://myanimelist.net/anime/${data.mal_id}`
        : `https://myanimelist.net/${
            contentTypeMap[content_type]?.mal || content_type
          }.php?q=${title}`,
    },
    {
      title: "AniList",
      host: hosts.al,
      url: `https://anilist.co/search/${
        contentTypeMap[content_type]?.al || content_type
      }?search=${title}&sort=SEARCH_MATCH`,
    },
    {
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
      title: "ANN",
      host: hosts.ann,
      url:
        getUrl("ann") ?? `https://www.animenewsnetwork.com/search?q=${title}`,
    },
    {
      title: "Wikipedia",
      host: hosts.wiki,
      url:
        content_type !== "character"
          ? getUrl("wiki") ??
            `https://en.wikipedia.org/w/index.php?search=${title}`
          : null,
    },
    {
      title: "Amanogawa",
      host: hosts.agawa,
      url: isAnime ? await getAmanogawaURL(data) : null,
    },
  ];

  render(
    () => (
      <div id="ani-buttons">
        <h3
          class={`hikka-features scroll-m-20 font-display ${
            smallerTitle ? "text-lg" : "text-xl"
          } font-bold tracking-normal`}
        >
          Інші джерела
          <img src={HikkaFLogoSmall} style="width: 21px; height: 20px" />
        </h3>
        <div>
          <For each={searchUrls}>
            {(elem) => (
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
            )}
          </For>
        </div>
      </div>
    ),
    location
  );
}
