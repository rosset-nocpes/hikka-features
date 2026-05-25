import ky from 'ky';

import type { ReaderContent } from '../reader.types';

abstract class BaseScraper {
  abstract readonly name: string;

  abstract readonly baseUrl: string;
  abstract readonly endpoints: Record<string, string>;

  protected async request(
    url: string | URL | Request,
    method: 'GET' | 'POST' = 'GET',
    data?: any,
  ) {
    const absoluteUrl = typeof url === 'string' && !url.startsWith('http') ? `${this.baseUrl}/${url}` : url;

    try {
      const response = await ky(absoluteUrl, { method, body: data }).text();
      return response;
    } catch (error) {
      console.error(`[${this.name}] Error during ${method} ${url}:`, error);
      throw new Error(`${this.name} failed to communicate with ${url}`);
    }
  }

  abstract search(data: any): Promise<string>;
  abstract getChapterList(url: string): Promise<ReaderContent>;
  abstract getChapter(url: string): Promise<string | string[] | null>;
}

export default BaseScraper;
