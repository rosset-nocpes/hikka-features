/* eslint-disable no-undef */
export default async function UCharButton(slug, previousAnimeSlug) {
  console.log(previousAnimeSlug);

  const char_data =
    previousAnimeSlug == undefined
      ? await (
          await fetch(`https://api.hikka.io/characters/${slug}/anime`)
        ).json()
      : null;

  // TODO: somehow make to know exactly what anime is this
  const anime_data = await (
    await fetch(
      `https://api.hikka.io/anime/${previousAnimeSlug !== undefined ? previousAnimeSlug : char_data.list[0].anime.slug}/characters?page=1&size=100`,
    )
  ).json();

  for (let i = 1; i <= anime_data.pagination.total; i++) {
    const char_page = await (
      await fetch(
        `https://api.hikka.io/anime/${previousAnimeSlug !== undefined ? previousAnimeSlug : char_data.list[0].anime.slug}/characters?page=${i}&size=100`,
      )
    ).json();

    for (let i = 0; i < char_page.list.length; i++) {
      const element = char_page.list[i];

      const character = element.character;

      const pendings = await (
        await fetch(`https://api.hikka.io/edit/list?page=1&size=1`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sort: ['edit_id:desc', 'created:desc'],
            content_type: 'character',
            status: 'pending',
            slug: character.slug,
          }),
        })
      ).json();

      if (
        character.slug !== slug &&
        character.name_ua == null &&
        pendings.pagination.total == 0
      ) {
        const url = `https://hikka.io/edit/new?content_type=character&slug=${character.slug}`;
        return url;
      }
    }
  }
}
