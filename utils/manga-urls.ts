import ky from 'ky';

export async function getMangaupdatesURL(title: string) {
  const url =
    'https://corsproxy.io/?' +
    encodeURIComponent('https://api.mangaupdates.com/v1/series/search');
  const response = await ky
    .post(url, {
      json: {
        search: title,
      },
    })
    .json<any>();
  return response['results'][0]['record']['url'];
}

export async function getDengekiURL(title: string) {
  const url =
    'https://corsproxy.io/?' +
    encodeURIComponent(
      `https://api.dengeki.one/search/?search=${encodeURIComponent(title)}`,
    );
  const x = (await ky.get(url).json<any[]>())[0];

  if (x === undefined) {
    return;
  }

  return `https://dengeki.one/catalog?title=${x['slug']}&translator=${x['default_translator_slug']}&volume=1`;
}
