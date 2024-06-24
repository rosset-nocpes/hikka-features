export async function getMangaupdatesURL(title: string) {
  const url =
    "https://corsproxy.io/?" +
    encodeURIComponent("https://api.mangaupdates.com/v1/series/search");
  const response = await (
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        search: title,
      }),
    })
  ).json();
  return response["results"][0]["record"]["url"];
}

export async function getDengekiURL(title: string) {
  const url =
    "https://corsproxy.io/?" +
    encodeURIComponent(
      `https://api.dengeki.one/search/?search=${encodeURIComponent(title)}`
    );
  let x = (await (await fetch(url)).json())[0];

  if (x === undefined) {
    return null;
  }

  return `https://dengeki.one/catalog?title=${x["slug"]}&translator=${x["default_translator_slug"]}&volume=1`;
}
