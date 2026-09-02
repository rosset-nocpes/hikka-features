import ky from 'ky';

export default async function UCharURL(
  slug: string,
  content_type: string,
  previousAnimeSlug: string,
) {
  const isPerson = content_type == 'person';

  const data =
    previousAnimeSlug == ''
      ? await ky
          .get(
            `https://api.hikka.io/${
              content_type != 'person' ? 'characters' : 'people'
            }/${slug}/anime`,
          )
          .json<any>()
      : null;

  // TODO: somehow make to know exactly what anime is this
  const anime_data = await ky
    .get(
      `https://api.hikka.io/anime/${
        previousAnimeSlug != '' ? previousAnimeSlug : data.list[0].anime.slug
      }/${!isPerson ? 'characters' : 'staff'}?page=1&size=100`,
    )
    .json<any>();

  for (let i = 1; i <= anime_data.pagination.total; i++) {
    const page = await ky
      .get(
        `https://api.hikka.io/anime/${
          previousAnimeSlug != '' ? previousAnimeSlug : data.list[0].anime.slug
        }/${!isPerson ? 'characters' : 'staff'}?page=${i}&size=100`,
      )
      .json<any>();

    for (let i = 0; i < page.list.length; i++) {
      const element = page.list[i];

      const content = !isPerson ? element.character : element.person;

      const pendings = await ky
        .post(`https://api.hikka.io/edit/list?page=1&size=1`, {
          json: {
            sort: ['edit_id:desc', 'created:desc'],
            content_type: !isPerson ? 'character' : 'person',
            status: 'pending',
            slug: content.slug,
          },
        })
        .json<any>();

      if (
        content.slug != slug &&
        content.name_ua == null &&
        pendings.pagination.total == 0
      ) {
        const url = `https://hikka.io/edit/new?content_type=${
          !isPerson ? 'character' : 'person'
        }&slug=${content.slug}`;
        return url;
      }
    }
  }
}
