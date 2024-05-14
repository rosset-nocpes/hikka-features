/* eslint-disable no-undef */
export default async function UCharButton(
  slug,
  content_type,
  previousAnimeSlug,
) {
  const isPerson = content_type == 'person';

  const data =
    previousAnimeSlug == ''
      ? await (
          await fetch(
            `https://api.hikka.io/${content_type != 'person' ? 'characters' : 'people'}/${slug}/anime`,
          )
        ).json()
      : null;

  // TODO: somehow make to know exactly what anime is this
  const anime_data = await (
    await fetch(
      `https://api.hikka.io/anime/${previousAnimeSlug != '' ? previousAnimeSlug : data.list[0].anime.slug}/${!isPerson ? 'characters' : 'staff'}?page=1&size=100`,
    )
  ).json();

  for (let i = 1; i <= anime_data.pagination.total; i++) {
    const page = await (
      await fetch(
        `https://api.hikka.io/anime/${previousAnimeSlug != '' ? previousAnimeSlug : data.list[0].anime.slug}/${!isPerson ? 'characters' : 'staff'}?page=${i}&size=100`,
      )
    ).json();

    for (let i = 0; i < page.list.length; i++) {
      const element = page.list[i];

      const content = !isPerson ? element.character : element.person;

      const pendings = await (
        await fetch(`https://api.hikka.io/edit/list?page=1&size=1`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sort: ['edit_id:desc', 'created:desc'],
            content_type: !isPerson ? 'character' : 'person',
            status: 'pending',
            slug: content.slug,
          }),
        })
      ).json();

      if (
        content.slug != slug &&
        content.name_ua == null &&
        pendings.pagination.total == 0
      ) {
        const url = `https://hikka.io/edit/new?content_type=${!isPerson ? 'characters' : 'person'}&slug=${content.slug}`;
        return url;
      }
    }
  }
}
