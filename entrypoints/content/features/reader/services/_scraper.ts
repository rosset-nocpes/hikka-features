import axios from 'axios';
import type { ReaderContent } from '../reader.types';

abstract class BaseScraper {
  abstract readonly name: string;

  abstract readonly baseUrl: string;
  abstract readonly endpoints: Record<string, string>;

  private getProxyUrl(targetUrl: string): string {
    const { backendBranch } = useSettings.getState();
    const backendBase = BACKEND_BRANCHES[backendBranch];
    const absoluteUrl = targetUrl.startsWith('http')
      ? targetUrl
      : `${this.baseUrl}/${targetUrl}`;

    return `${backendBase}/proxy?r=${encodeURIComponent(absoluteUrl)}`;
  }

  // info: idk, for some reason proxyUrl is working differently when using it in the request method
  protected async request(
    url: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any,
  ) {
    const proxyUrl = this.getProxyUrl(url);
    try {
      const response = await axios({ method, url: proxyUrl, data });
      return response.data;
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
