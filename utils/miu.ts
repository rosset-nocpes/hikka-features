import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://corsproxy.io/?url=https://manga.in.ua';

function parseUserHash(html: string): string | null {
  const $ = cheerio.load(html);
  let userHash: string | null = null;
  $('script').each((_i, el) => {
    const scriptContent = $(el).html();
    if (scriptContent?.includes("site_login_hash = '")) {
      const match = scriptContent.match(/site_login_hash = '([^']+)';/);
      if (match?.[1]) {
        userHash = match[1];
        return false; // break a .each loop in cheerio
      }
    }
  });
  if (!userHash) {
    console.warn('Could not find user_hash (site_login_hash).');
  }
  return userHash;
}

function parseUserHashQuery(html: string, endpoint: string): string | null {
  const $ = cheerio.load(html);
  let userHashQuery: string | null = null;

  $('script').each((_i, el) => {
    const scriptContent = $(el).html();
    if (
      scriptContent?.includes(endpoint) &&
      scriptContent.includes('site_login_hash')
    ) {
      const relevantPart = scriptContent.substring(
        scriptContent.indexOf(endpoint),
      );
      const paramsMatch = relevantPart.match(/\{(.*?)\}/s);
      if (paramsMatch?.[1]) {
        const paramsString = paramsMatch[1];
        const hashParamMatch = paramsString.match(
          /["']?([a-zA-Z0-9_]+)["']?\s*:\s*["']?site_login_hash["']?/,
        );
        if (hashParamMatch?.[1] && hashParamMatch[1] !== 'site_login_hash') {
          userHashQuery = hashParamMatch[1];
        } else {
          const fixedHashQueryMatch = paramsString.match(
            /["']?(dle_user_hash|user_hash)["']?\s*:\s*["']?(site_login_hash|dle_user_hash)["']?/,
          );
          if (fixedHashQueryMatch?.[1]) {
            // Find the key part if value is site_login_hash or dle_user_hash
            const potentialKey = paramsString
              .substring(0, paramsString.indexOf(fixedHashQueryMatch[0]))
              .split(/[,{]/)
              .pop()
              ?.trim();
            const keyMatch = potentialKey?.match(/["']?([a-zA-Z0-9_]+)["']?$/);
            if (keyMatch?.[1]) {
              userHashQuery = keyMatch[1];
            } else if (
              fixedHashQueryMatch[1] &&
              !['site_login_hash', 'dle_user_hash'].includes(
                fixedHashQueryMatch[1],
              )
            ) {
              userHashQuery = fixedHashQueryMatch[1];
            }
          }
        }

        if (userHashQuery) return false; // break
      }
    }
  });
  if (!userHashQuery && html.includes('dle_user_hash')) {
    userHashQuery = 'dle_user_hash';
  }

  if (!userHashQuery) {
    console.warn(
      `Could not find user_hash_query for endpoint: ${endpoint}. Trying common 'user_hash'.`,
    );
    userHashQuery = 'user_hash';
  }
  return userHashQuery;
}

export async function get_miu_chapter_pages(url: string): Promise<string[]> {
  const chapterPageResponse = await axios
    .get(`https://corsproxy.io/?url=${url}`)
    .catch((error) => {
      console.error('Error fetching chapter page:', error);
      throw new Error(`Failed to fetch chapter page at ${url}`);
    });
  const chapterPageHtml = chapterPageResponse.data;
  const $chapterPage = cheerio.load(chapterPageHtml);

  // 5. Extract details for image list request from chapter page
  const userHashChapterPage = parseUserHash(chapterPageHtml);
  if (!userHashChapterPage) {
    throw new Error('Could not parse user_hash from chapter page.');
  }

  const imageListEndpoint =
    'engine/ajax/controller.php?mod=load_chapters_image';
  const userHashQueryChapterPage = parseUserHashQuery(
    chapterPageHtml,
    imageListEndpoint,
  );
  if (!userHashQueryChapterPage) {
    throw new Error(
      'Could not parse user_hash_query from chapter page for images.',
    );
  }

  const comicsElement = $chapterPage('div#comics');
  if (!comicsElement.length) {
    throw new Error('Could not find "comics" element on chapter page.');
  }
  const newsIdForImages = comicsElement.attr('data-news_id');
  if (!newsIdForImages) {
    throw new Error(
      'Missing data-news_id from "comics" element for fetching images.',
    );
  }

  // 6. Fetch image list
  const imageUrlParams = new URLSearchParams();
  imageUrlParams.append('news_id', newsIdForImages);
  imageUrlParams.append('action', 'show');
  imageUrlParams.append(userHashQueryChapterPage, userHashChapterPage);

  const finalImageUrl = `${BASE_URL}/${encodeURIComponent(`${imageListEndpoint}&${imageUrlParams.toString()}`)}`;
  console.log(`Fetching image list from: ${finalImageUrl}`);

  const imageListHtmlResponse = await axios
    .get(finalImageUrl)
    .catch((error) => {
      console.error('Error fetching image list:', error);
      throw new Error('Failed to fetch image list.');
    });

  const $imageList = cheerio.load(imageListHtmlResponse.data);
  const images: string[] = [];
  $imageList('img').each((_, imgElement) => {
    const imageUrl = $imageList(imgElement).attr('data-src');
    if (imageUrl) {
      images.push(
        `${import.meta.env.WXT_BACKEND_BASE_URL}/proxy?r=${imageUrl}`,
      );
    }
  });

  if (images.length === 0) {
    console.warn(
      'No images found. The response might be unexpected or selector needs adjustment.',
    );
    console.warn(
      'Image list response data:',
      `${imageListHtmlResponse.data.substring(0, 500)}...`,
    );
  }

  console.log(`Fetched ${images.length} pages.`);
  return images;
}

export async function get_miu_chapters(data: any): Promise<API.ChapterData[]> {
  let manga_url: string | undefined = data.external.find(
    (link: any) => link.text === 'Manga.in.ua',
  ).url;

  if (!manga_url) {
    console.log(`Searching for manga: ${data.title}`);
    const searchFormData = new URLSearchParams();
    searchFormData.append('do', 'search');
    searchFormData.append('subaction', 'search');
    searchFormData.append('story', `${data.title} ${data.year}`);
    searchFormData.append('search_start', '1'); // page 1

    const searchResponse = await axios
      .post(`${BASE_URL}/index.php?do=search`, searchFormData)
      .catch((error) => {
        console.error('Error searching for manga:', error);
        throw new Error(`Failed to search for manga "${data.title}"`);
      });

    const $search = cheerio.load(searchResponse.data);
    const mangaLinkElement = $search(
      'main.main article.item h3.card__title a',
    ).first();
    if (!mangaLinkElement.length) {
      console.error('Manga not found from search.');
      throw new Error(`Manga "${data.title}" not found.`);
    }
    manga_url = mangaLinkElement.attr('href');
    if (!manga_url) {
      console.error('Manga URL not found from search result.');
      throw new Error('Could not extract manga URL from search result.');
    }
  }
  console.log(`Found manga page URL: ${manga_url}`);

  // 2. Go to manga page to get details for chapter list request
  const mangaPageResponse = await axios
    .get(`https://corsproxy.io/?url=${manga_url}`)
    .catch((error) => {
      console.error('Error fetching manga page:', error);
      throw new Error(`Failed to fetch manga page at ${manga_url}`);
    });
  const mangaPageHtml = mangaPageResponse.data;
  const $mangaPage = cheerio.load(mangaPageHtml);

  const userHashMangaPage = parseUserHash(mangaPageHtml);
  if (!userHashMangaPage) {
    throw new Error('Could not parse user_hash from manga page.');
  }

  const chapterListEndpoint = 'engine/ajax/controller.php?mod=load_chapters';
  const userHashQueryMangaPage = parseUserHashQuery(
    mangaPageHtml,
    chapterListEndpoint,
  );
  if (!userHashQueryMangaPage) {
    throw new Error('Could not parse user_hash_query from manga page.');
  }

  const linkstocomicsElement = $mangaPage('div#linkstocomics');
  if (!linkstocomicsElement.length) {
    throw new Error('Could not find "linkstocomics" element on manga page.');
  }
  const newsId = linkstocomicsElement.attr('data-news_id');
  const newsCategory = linkstocomicsElement.attr('data-news_category');
  // const thisLink = linkstocomicsElement.attr("data-this_link");

  if (!newsId || !newsCategory) {
    throw new Error('Missing data attributes from "linkstocomics" element.');
  }

  // 3. Fetch chapter list
  console.log('Fetching chapter list...');
  const chapterListFormData = new URLSearchParams();
  chapterListFormData.append('action', 'show');
  chapterListFormData.append('news_id', newsId);
  chapterListFormData.append('news_category', newsCategory);
  // chapterListFormData.append("this_link", thisLink);
  chapterListFormData.append(userHashQueryMangaPage, userHashMangaPage);

  const chapterListResponse = await axios
    .post(`${BASE_URL}/${chapterListEndpoint}`, chapterListFormData)
    .catch((error) => {
      console.error('Error fetching chapter list:', error);
      throw new Error('Failed to fetch chapter list.');
    });

  const $chapterList = cheerio.load(chapterListResponse.data);
  const chapters: API.ChapterData[] = [];

  $chapterList('body')
    .children()
    .each((_i, el) => {
      const $chapterElement = $chapterList(el);
      const linkElement = $chapterElement.find('a').first();
      const chapterHref = linkElement.attr('href');
      const chapterTitleText = linkElement.text().trim(); // "Розділ X: Назва розділу" or "Розділ X"

      const chapterMatch = chapterTitleText.match(
        /Том\s*(\d+)\.\s*Розділ\s*([\d.]+)\s*(?:-\s*(.*))?/i,
      );
      const chapterVolume = chapterMatch ? chapterMatch[1] : 'N/A';
      const chapterNumber = chapterMatch ? chapterMatch[2] : 'N/A';
      const chapterTitle = chapterMatch?.[3] || '';

      const chapterId = chapterHref
        ? chapterHref.split('/').pop()?.split('-')[0] || chapterNumber
        : chapterNumber;

      chapters.push({
        id: chapterId,
        volume: Number(chapterVolume),
        chapter: Number(chapterNumber),
        title: chapterTitle,
        url: chapterHref || '',
      });
    });

  if (chapters.length === 0) {
    console.warn(
      'No chapters found. The response might be unexpected or selector needs adjustment.',
    );
    console.warn(
      'Chapter list response data:',
      `${chapterListResponse.data.substring(0, 500)}...`,
    );
  }

  console.log(`Fetched ${chapters.length} chapters.`);
  return chapters;
}
