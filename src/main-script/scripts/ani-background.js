/* eslint-disable no-undef */
// @name        AniBackground
// @version     1.0.0
// @author      ~rosset-nocpes
// @description Adds background

export default async function aniBackground(anime_data) {
  const background = document.querySelector('body main > .grid');

  const title = anime_data.title_ja;

  const kitsuData = await (
    await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${title}`)
  ).json();

  const cover = kitsuData.data[0].attributes.coverImage.small;

  document
    .getElementsByTagName('head')[0]
    .insertAdjacentHTML(
      'beforeend',
      `<link rel="preload" as="image" href="${cover}" fetchpriority="high">`,
    );

  background.insertAdjacentHTML(
    'afterbegin',
    `<div class="absolute left-0 top-0 -z-20 h-80 w-full overflow-hidden opacity-40 gradient-mask-b-0"><img alt="cover" fetchpriority="high" decoding="async" data-nimg="fill" class="opacity-1 !transition relative size-full object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="100vw" src="${cover}"></div>`,
  );
}
