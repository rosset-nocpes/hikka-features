/* eslint-disable no-undef */
// @name        AniButtons Expansion
// @version     1.2.0
// @author      ~rosset-nocpes
// @description In future will be based on https://greasyfork.org/en/scripts/398046-anime-website-custom-buttons-plus

import getAmanogawaId, { amanogawaURL } from "./amanogawa-button";

export default function aniButtons(data) {
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

  const urls = {
    mal: `https://myanimelist.net/${
      contentTypeMap[content_type]?.mal || content_type
    }.php?q=${title}`,
    al: `https://anilist.co/search/${
      contentTypeMap[content_type]?.al || content_type
    }?search=${title}&sort=SEARCH_MATCH`,
    ad:
      getUrl("ad") ??
      `https://anidb.net/${
        contentTypeMap[content_type]?.ad || content_type
      }/?adb.search=${
        ["person", "character"].includes(content_type) &&
        title.split(" ").length == 2
          ? `${title.split(" ")[1]} ${title.split(" ")[0]}`
          : title
      }&do.search=1`,
    ann: getUrl("ann") ?? `https://www.animenewsnetwork.com/search?q=${title}`,
    wiki:
      content_type !== "character"
        ? getUrl("wiki") ??
          `https://en.wikipedia.org/w/index.php?search=${title}`
        : null,
    agawa: isAnime ? amanogawaURL(getAmanogawaId(data)) : null,
  };

  console.log(urls.agawa);

  const searchUrls = [
    { host: hosts.mal, url: urls.mal },
    { host: hosts.al, url: urls.al },
    { host: hosts.ad, url: urls.ad },
    { host: hosts.ann, url: urls.ann },
    { host: hosts.wiki, url: urls.wiki },
    { host: hosts.agawa, url: urls.agawa },
  ];

  let ani_buttons = [];

  searchUrls.forEach((element) => {
    if (element.url == null) {
      return;
    }
    ani_buttons.push(
      <a style="display: flex;" href={element.url} target="_blank">
        <img
          style="width:16px;height:16px;margin-right:2px;"
          src={`https://www.google.com/s2/favicons?domain=${element.host}`}
        />
      </a>
    );
  });

  return ani_buttons;
}
