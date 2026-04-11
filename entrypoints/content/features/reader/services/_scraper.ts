import ky from 'ky';

import type { ReaderContent } from '../reader.types';

abstract class BaseScraper {
  abstract readonly name: string;

  abstract readonly baseUrl: string;
  abstract readonly endpoints: Record<string, string>;

  protected async request(
    url: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any,
  ) {
    const absoluteUrl = url.startsWith('http') ? url : `${this.baseUrl}/${url}`;

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
