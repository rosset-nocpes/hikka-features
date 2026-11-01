import * as cheerio from 'cheerio';

import { sendToBackground } from '@/utils/messaging';

import type { ReaderContent, TitleInfo } from '../reader.types';

/** A site the reader reads from, fetched through the background. */
abstract class BaseScraper {
  constructor(
    readonly name: string,
    readonly baseUrl: string,
  ) {}

  /** The title's page on the site. */
  abstract search(title: TitleInfo): Promise<string>;
  abstract getChapterList(url: string): Promise<ReaderContent>;
  /** A manga chapter's page images, or a novel chapter's HTML. */
  abstract getChapter(url: string): Promise<string | string[] | null>;

  /** `url` made absolute; it may be relative to the site. */
  protected resolveUrl(url: string) {
    return url.startsWith('http')
      ? url
      : `${this.baseUrl}/${url.replace(/^\//, '')}`;
  }

  /** A page's text. */
  protected async request(
    url: string,
    method: 'GET' | 'POST' = 'GET',
    data?: URLSearchParams,
  ) {
    try {
      const response = await sendToBackground('remote-fetch', {
        url: this.resolveUrl(url),
        method,
        body: data?.toString(),
      });
      if (!response?.ok) {
        throw new Error(`${response?.status} ${response?.statusText}`);
      }
      return response.body;
    } catch (error) {
      console.error(`[${this.name}] Error during ${method} ${url}:`, error);
      throw new Error(`${this.name} failed to communicate with ${url}`);
    }
  }

  /** A page, parsed. */
  protected async load(...args: Parameters<BaseScraper['request']>) {
    return cheerio.load(await this.request(...args));
  }
}

export default BaseScraper;
