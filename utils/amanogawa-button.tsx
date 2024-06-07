// @name        Amanogawa Button
// @version     1.1
// @author      Lorg0n
// @description original: https://gist.github.com/rosset-nocpes/f251942d47662b725329772533769399/raw/

export default async function getAmanogawaURL(anime_data: any) {
  const threshold = 0.8; // Значення -> [0; 1]. Це рівень перевірки схожості назви аніме, тому що пошук на amanogawa працює дуже дивно й іноді видає аніме, які взагалі не потрібні були.

  const title_ja = anime_data["title_ja"];
  const title_year = anime_data["year"];

  const url_cors_proxy_amanogawa =
    "https://corsproxy.io/?" +
    encodeURIComponent(
      `https://amanogawa.space/api/search?s="${encodeURIComponent(title_ja)}"`
    );

  const amanogawa_data = await (await fetch(url_cors_proxy_amanogawa)).json();

  const anime = findMostSimilarEnJpName(
    title_ja,
    title_year,
    amanogawa_data,
    threshold
  );

  if (anime === null) {
    return null;
  }

  return `https://amanogawa.space/anime/${anime.id}`;
}

export function findMostSimilarEnJpName(
  input,
  inputYear,
  array,
  similarityThreshold
) {
  function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  let mostSimilarObject = null;
  let highestSimilarity = 0;

  array.forEach((obj) => {
    const enJpNameSimilarity =
      (input.length - levenshteinDistance(input, obj.en_jp_name)) /
      input.length;

    if (
      enJpNameSimilarity > highestSimilarity &&
      enJpNameSimilarity >= similarityThreshold &&
      obj.year
    ) {
      highestSimilarity = enJpNameSimilarity;
      mostSimilarObject = obj;
    }
  });

  return mostSimilarObject;
}
