import { MANGA_IN_UA_URL } from '@/constants/links';

import type { Chapter, ReaderContent, TitleInfo } from '../reader.types';

import { ReaderContentMode } from '../reader.enums';
import BaseScraper, { parseHtml } from './_scraper';

const ENDPOINTS = {
  search: 'index.php?do=search',
  loadChapters: 'engine/ajax/controller.php?mod=load_chapters',
  loadImages: 'engine/ajax/controller.php?mod=load_chapters_image',
};

class MIUScraper extends BaseScraper {
  constructor() {
    super('MIUScraper', MANGA_IN_UA_URL);
  }

  /** The session hash the site's AJAX endpoints want. */
  private extractUserHash(html: string): string {
    const match = html.match(/site_login_hash\s*=\s*'([^']+)'/);
    if (!match?.[1]) throw new Error('Could not find site_login_hash.');
    return match[1];
  }

  /** The name the page's script sends that hash under to `endpoint`. */
  private extractQueryKey(html: string, endpoint: string): string {
    const escaped = endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}.*?{(.*?)}`, 's');
    const match = html.match(regex);

    if (match?.[1]) {
      const keyMatch = match[1].match(
        /["']?([a-zA-Z0-9_]+)["']?\s*:\s*["']?(site_login_hash|dle_user_hash)["']?/,
      );
      if (
        keyMatch?.[1] &&
        !['site_login_hash', 'dle_user_hash'].includes(keyMatch[1])
      ) {
        return keyMatch[1];
      }
    }
    return html.includes('dle_user_hash') ? 'dle_user_hash' : 'user_hash';
  }

  async search(data: TitleInfo) {
    const title = data.title_ua || data.title_en || data.title_original;
    if (!title) throw new Error('The title has no name to search by.');

    let mangaUrl = data.external?.find(
      (link) => link.text === 'Manga.in.ua',
    )?.url;

    if (!mangaUrl) {
      const searchData = new URLSearchParams({
        do: 'search',
        subaction: 'search',
        story: `${title} ${data.year}`,
        search_start: '1',
      });

      let results = await this.load(ENDPOINTS.search, 'POST', searchData);

      // Nothing found with the year; try the title alone.
      if (results.querySelector('.berrors')) {
        searchData.set('story', title);
        results = await this.load(ENDPOINTS.search, 'POST', searchData);
      }

      mangaUrl =
        results
          .querySelector('main.main article.item h3.card__title a')
          ?.getAttribute('href') ?? undefined;
    }
    if (!mangaUrl) throw new Error(`Manga "${title}" not found.`);

    return mangaUrl;
  }

  async getChapterList(url: string): Promise<ReaderContent> {
    const pageHtml = await this.request(url);
    const container = parseHtml(pageHtml).querySelector('div#linkstocomics');

    const params = new URLSearchParams({
      action: 'show',
      news_id: container?.getAttribute('data-news_id') || '',
      news_category: container?.getAttribute('data-news_category') || '',
      this_link: container?.getAttribute('data-this_link') || '',
      [this.extractQueryKey(pageHtml, ENDPOINTS.loadChapters)]:
        this.extractUserHash(pageHtml),
    });

    const list = await this.load(ENDPOINTS.loadChapters, 'POST', params);
    const chapters: Chapter[] = [];

    for (const item of list.querySelectorAll('div.ltcitems')) {
      const link = item.querySelector('a');
      const href = link?.getAttribute('href') || '';
      const text = link?.textContent?.trim() ?? '';

      if (text.includes('Альтернативний')) continue;

      chapters.push({
        id:
          href.split('/').pop()?.split('-')[0] ||
          item.getAttribute('manga-chappter') ||
          '0',
        translator: item.getAttribute('translate') || '',
        date_upload: item.firstElementChild?.textContent?.trim() ?? '',
        volume: Number(item.getAttribute('manga-tom') || 0),
        chapter: Number(item.getAttribute('manga-chappter') || 0),
        title: text.split('-')[1]?.trim() ?? '',
        url: href,
      });
    }

    return { displayMode: ReaderContentMode.Chapters, chapters };
  }

  /** The chapter's page images. */
  async getChapter(url: string) {
    const html = await this.request(url);

    const params = new URLSearchParams({
      news_id:
        parseHtml(html)
          .querySelector('div#comics')
          ?.getAttribute('data-news_id') || '',
      action: 'show',
      [this.extractQueryKey(html, ENDPOINTS.loadImages)]:
        this.extractUserHash(html),
    });

    const images = await this.load(`${ENDPOINTS.loadImages}&${params}`);
    return [...images.querySelectorAll('img')].flatMap(
      (img) => img.getAttribute('data-src') || [],
    );
  }
}

export const miuScraper = new MIUScraper();
