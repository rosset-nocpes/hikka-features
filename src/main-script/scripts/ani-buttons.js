/* eslint-disable no-undef */
// @name        AniButtons Expansion
// @version     1.2.0
// @author      ~rosset-nocpes
// @description In future will be based on https://greasyfork.org/en/scripts/398046-anime-website-custom-buttons-plus

export default function aniButtons(anime_data) {
  const title = anime_data.title_ja;

  const hosts = {
    mal: 'myanimelist.net',
    al: 'anilist.co',
    ad: 'anidb.net',
    ann: 'animenewsnetwork.com',
    wiki: 'en.wikipedia.org',
  };

  const getUrl = (website) =>
    anime_data.external.find((obj) => obj.url?.includes(hosts[website])).url;

  const urls = {
    mal: `https://myanimelist.net/anime.php?q=${title}`,
    al: `https://anilist.co/search/anime?search=${title}&sort=SEARCH_MATCH`,
    ad:
      getUrl('ad') ??
      `https://anidb.net/anime/?adb.search=${title}&do.search=1`,
    ann: getUrl('ann') ?? `https://www.animenewsnetwork.com/search?q=${title}`,
    wiki:
      getUrl('wiki') ?? `https://en.wikipedia.org/w/index.php?search=${title}`,
  };

  const searchUrls = [
    { host: hosts.mal, url: urls.mal },
    { host: hosts.al, url: urls.al },
    { host: hosts.ad, url: urls.ad },
    { host: hosts.ann, url: urls.ann },
    { host: hosts.wiki, url: urls.wiki },
  ];

  let ani_buttons = [];

  searchUrls.forEach((element) => {
    ani_buttons.push(
      <a style="display: flex;" href={element.url}>
        <img
          style="width:16px;height:16px;margin-right:2px;"
          src={`https://www.google.com/s2/favicons?domain=${element.host}`}
        />
      </a>,
    );
  });

  return ani_buttons;
}
