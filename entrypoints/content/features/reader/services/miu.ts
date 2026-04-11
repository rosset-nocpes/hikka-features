import type { Chapter, ReaderContent } from '../reader.types';

import { ReaderContentMode } from '../reader.enums';
import BaseScraper from './_scraper';

class MIUScraper extends BaseScraper {
  name = 'MIUScraper';
  baseUrl = 'https://manga.in.ua';
  endpoints = {
    search: `${this.baseUrl}/index.php?do=search`,
    loadChapters: 'engine/ajax/controller.php?mod=load_chapters',
    loadImages: 'engine/ajax/controller.php?mod=load_chapters_image',
  };

  /**
   * Internal parser: Extracts site_login_hash
   */
  private extractUserHash(html: string): string {
    const match = html.match(/site_login_hash\s*=\s*'([^']+)'/);
    if (!match?.[1]) throw new Error('Could not find site_login_hash.');
    return match[1];
  }

  /**
   * Internal parser: Detects the dynamic key name for the hash query
   */
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

  public async search(data: any) {
    const title = data.title_ua || data.title_en;
    let mangaUrl: string = data.external.find(
      (link: any) => link.text === 'Manga.in.ua',
    )?.url;

    if (!mangaUrl) {
      const searchData = new URLSearchParams({
        do: 'search',
        subaction: 'search',
        story: `${title} ${data.year}`,
        search_start: '1',
      });

      const searchHtml = await this.request(
        this.endpoints.search,
        'POST',
        searchData,
      );

      const search = new DOMParser().parseFromString(searchHtml, 'text/html');

      mangaUrl =
        search
          .querySelector('main.main article.item h3.card__title a')
          ?.getAttribute('href') || '';
    }
    if (!mangaUrl) throw new Error(`Manga "${title}" not found.`);

    return mangaUrl;
  }

  /**
   * Public API: Fetches all chapters for a manga
   */
  public async getChapterList(url: string): Promise<ReaderContent> {
    // 1. Parse Manga Page for AJAX details
    const pageHtml = await this.request(url);
    const page = new DOMParser().parseFromString(pageHtml, 'text/html');
    const container = page.querySelector('div#linkstocomics');

    const params = new URLSearchParams({
      action: 'show',
      news_id: container?.getAttribute('data-news_id') || '',
      news_category: container?.getAttribute('data-news_category') || '',
      [this.extractQueryKey(pageHtml, this.endpoints.loadChapters)]:
        this.extractUserHash(pageHtml),
    });

    // 2. Fetch Chapter List via AJAX
    const listHtml = await this.request(
      this.endpoints.loadChapters,
      'POST',
      params,
    );
    const list = new DOMParser().parseFromString(listHtml, 'text/html');
    const chapters: Chapter[] = [];

    list.querySelectorAll('body > *').forEach((el) => {
      const linkEl = el.querySelector('a');
      const href = linkEl?.getAttribute('href') || '';
      const text = linkEl?.textContent?.trim() || '';

      if (text.includes('Альтернативний переклад')) return;

      chapters.push({
        id:
          href.split('/').pop()?.split('-')[0] ||
          el.getAttribute('manga-chappter') ||
          '0',
        translator: el.getAttribute('translate') || '',
        date_upload: el.children[0]?.textContent?.trim() || '',
        volume: Number(el.getAttribute('manga-tom') || 0),
        chapter: Number(el.getAttribute('manga-chappter') || 0),
        title: text.includes('-') ? text.split('-')[1].trim() : '',
        url: href,
      });
    });

    return { displayMode: ReaderContentMode.Chapters, chapters };
  }

  /**
   * Public API: Fetches image pages for a specific chapter URL
   */
  public async getChapter(url: string) {
    const html = await this.request(url);
    const page = new DOMParser().parseFromString(html, 'text/html');

    const params = new URLSearchParams({
      news_id:
        page.querySelector('div#comics')?.getAttribute('data-news_id') || '',
      action: 'show',
      [this.extractQueryKey(html, this.endpoints.loadImages)]:
        this.extractUserHash(html),
    });

    const imgListHtml = await this.request(
      `${this.endpoints.loadImages}&${params.toString()}`,
    );
    const imgs = new DOMParser().parseFromString(imgListHtml, 'text/html');

    const images: string[] = [];
    imgs.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('data-src');
      if (src) images.push(src);
    });

    return images;
  }
}

const miuScraper = new MIUScraper();

export default miuScraper;
