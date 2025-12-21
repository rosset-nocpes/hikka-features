import axios from 'axios';
import * as cheerio from 'cheerio';

class MIUScraper {
  private readonly baseUrl = 'https://manga.in.ua';
  private readonly endpoints = {
    search: `${this.baseUrl}/index.php?do=search`,
    loadChapters: 'engine/ajax/controller.php?mod=load_chapters',
    loadImages: 'engine/ajax/controller.php?mod=load_chapters_image',
  };

  /**
   * Resolves the proxy-wrapped URL for requests
   */
  private async getProxyUrl(targetUrl: string): Promise<string> {
    const branch = await backendBranch.getValue();
    const backendBase = BACKEND_BRANCHES[branch];
    const absoluteUrl = targetUrl.startsWith('http')
      ? targetUrl
      : `${this.baseUrl}/${targetUrl}`;

    return `${backendBase}/proxy?r=${encodeURIComponent(absoluteUrl)}`;
  }

  /**
   * Generic request helper
   */
  private async request(
    url: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any,
  ) {
    const proxyUrl = await this.getProxyUrl(url);
    try {
      const response = await axios({ method, url: proxyUrl, data });
      return response.data;
    } catch (error) {
      console.error(`[MIUScraper] Error during ${method} ${url}:`, error);
      throw new Error(`MIUScraper failed to communicate with ${url}`);
    }
  }

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

  /**
   * Public API: Fetches all chapters for a manga
   */
  public async getChapters(data: any): Promise<API.ChapterData[]> {
    const title = data.title_ua || data.title_en;
    let mangaUrl = data.external.find(
      (link: any) => link.text === 'Manga.in.ua',
    )?.url;

    // 1. Search if necessary
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
      const $search = cheerio.load(searchHtml);
      mangaUrl = $search('main.main article.item h3.card__title a')
        .first()
        .attr('href');
      if (!mangaUrl) throw new Error(`Manga "${title}" not found.`);
    }

    // 2. Parse Manga Page for AJAX details
    const pageHtml = await this.request(mangaUrl);
    const $page = cheerio.load(pageHtml);
    const container = $page('div#linkstocomics');

    const params = new URLSearchParams({
      action: 'show',
      news_id: container.attr('data-news_id') || '',
      news_category: container.attr('data-news_category') || '',
      [this.extractQueryKey(pageHtml, this.endpoints.loadChapters)]:
        this.extractUserHash(pageHtml),
    });

    // 3. Fetch Chapter List via AJAX
    const listHtml = await this.request(
      this.endpoints.loadChapters,
      'POST',
      params,
    );
    const $list = cheerio.load(listHtml);
    const chapters: API.ChapterData[] = [];

    $list('body > *').each((_, el) => {
      const $el = $list(el);
      const $link = $el.find('a').first();
      const href = $link.attr('href') || '';
      const text = $link.text().trim();

      if (text.includes('Альтернативний переклад')) return;

      chapters.push({
        id:
          href.split('/').pop()?.split('-')[0] ||
          $el.attr('manga-chappter') ||
          '0',
        scanlator: $el.attr('translate') || '',
        date_upload: $el.children().first().text().trim(),
        volume: Number($el.attr('manga-tom') || 0),
        chapter: Number($el.attr('manga-chappter') || 0),
        title: text.includes('-') ? text.split('-')[1].trim() : '',
        url: href,
      });
    });

    return chapters;
  }

  /**
   * Public API: Fetches image pages for a specific chapter URL
   */
  public async getChapterPages(url: string): Promise<string[]> {
    const html = await this.request(url);
    const $ = cheerio.load(html);

    const params = new URLSearchParams({
      news_id: $('div#comics').attr('data-news_id') || '',
      action: 'show',
      [this.extractQueryKey(html, this.endpoints.loadImages)]:
        this.extractUserHash(html),
    });

    const imgListHtml = await this.request(
      `${this.endpoints.loadImages}&${params.toString()}`,
    );
    const $imgs = cheerio.load(imgListHtml);
    const branch = await backendBranch.getValue();
    const backendBase = BACKEND_BRANCHES[branch];

    const images: string[] = [];
    $imgs('img').each((_, img) => {
      const src = $(img).attr('data-src');
      if (src) images.push(`${backendBase}/proxy?r=${encodeURIComponent(src)}`);
    });

    return images;
  }
}

const miuScraper = new MIUScraper();

export default miuScraper;
