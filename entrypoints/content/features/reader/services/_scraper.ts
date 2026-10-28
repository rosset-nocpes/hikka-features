import { sendToBackground } from '@/utils/messaging';

import type { ReaderContent } from '../reader.types';

/** A site the reader reads from, fetched through the background. */
abstract class BaseScraper {
  constructor(
    readonly name: string,
    readonly baseUrl: string,
  ) {}

  /** The title's page on the site. */
  abstract search(data: any): Promise<string>;
  abstract getChapterList(url: string): Promise<ReaderContent>;
  /** A manga chapter's page images, or a novel chapter's HTML. */
  abstract getChapter(url: string): Promise<string | string[] | null>;

  /** A page's text; `url` may be relative to the site. */
  protected async request(
    url: string,
    method: 'GET' | 'POST' = 'GET',
    data?: URLSearchParams,
  ) {
    const absoluteUrl = url.startsWith('http') ? url : `${this.baseUrl}/${url}`;
    try {
      const response = await sendToBackground('remote-fetch', {
        url: absoluteUrl,
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
}

export default BaseScraper;
