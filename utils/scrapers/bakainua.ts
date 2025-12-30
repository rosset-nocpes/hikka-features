import * as cheerio from 'cheerio';
import { proxyUrl } from '@/entrypoints/background';
import BaseScraper from './_scraper';

class BIUScraper extends BaseScraper {
  name = 'BIUScraper';
  baseUrl = 'https://baka.in.ua';
  endpoints = {
    search: `${this.baseUrl}/search?search%5B%5D`,
  };

  async search(title: string) {
    const r = await proxyUrl(
      `${this.endpoints.search}=${encodeURIComponent(title)}`,
    );

    const $page = cheerio.load(r);
    const novels = $page('#fictions-section .group a.block')
      .map((_i, el) => {
        const $novelElement = $page(el);
        return $novelElement.attr('href');
      })
      .toArray();

    if (!novels.length) {
      throw new Error('No results found');
    }

    return novels[0].startsWith('http')
      ? novels[0]
      : `${this.baseUrl}${novels[0]}`;
  }

  async getChapterList(url: string): Promise<NovelContent> {
    const r = await proxyUrl(url);
    const $ = cheerio.load(r);

    const $accordions = $('.accordion');
    const regex: RegExp = /(?<=- ).*/;

    const hasVolumes = $accordions
      .find('.accordion-header h3')
      .toArray()
      .some((el) => $(el).text().includes('Том'));

    if (hasVolumes) {
      const volumes: NovelVolume[] = [];

      $accordions.each((_i, accordion) => {
        const $header = $(accordion).find('.accordion-header');
        const $content = $(accordion).find('.accordion-content');
        const headerText = $header.find('h3').text();

        const volumeMatch = headerText.match(/Том\s+(\d+)/i);
        const volumeNumber = volumeMatch ? Number(volumeMatch[1]) : 0;

        const chapters = $content
          .find('li.group a')
          .map((_j, el) => {
            const $link = $(el);
            const chNum = Number($link.find('span').eq(0).text().trim());
            const href = $link.attr('href') || '';
            return {
              id: `vol${volumeNumber}-ch${chNum}`,
              volume: volumeNumber,
              chapter: chNum,
              title:
                $link.find('span').eq(1).text().trim().match(regex)?.[0] || '',
              translator: 'todo',
              date_upload: $link.find('span').eq(2).text().trim(),
              url: href.startsWith('http')
                ? href
                : `${this.baseUrl}/${href.replace(/^\//, '')}`,
            };
          })
          .toArray();

        volumes.push({
          number: volumeNumber,
          chapters: chapters.sort((a, b) => a.chapter - b.chapter),
        });
      });

      return {
        displayMode: 'volumes',
        volumes: volumes.sort((a, b) => a.number - b.number),
      };
    } else {
      const chapters: NovelChapter[] = [];

      $accordions.each((_i, accordion) => {
        const $content = $(accordion).find('.accordion-content');

        const accordionChapters = $content
          .find('li.group a')
          .map((_j, el) => {
            const $link = $(el);
            const chNum = Number($link.find('span').eq(0).text().trim());
            const href = $link.attr('href') || '';
            return {
              id: `ch${chNum}`,
              chapter: chNum,
              title:
                $link.find('span').eq(1).text().trim().match(regex)?.[0] || '',
              translator: 'todo',
              date_upload: $link.find('span').eq(2).text().trim(),
              url: href.startsWith('http')
                ? href
                : `${this.baseUrl}/${href.replace(/^\//, '')}`,
            };
          })
          .toArray();

        chapters.push(...accordionChapters);
      });

      return {
        displayMode: 'chapters',
        chapters: chapters.sort((a, b) => a.chapter - b.chapter),
      };
    }
  }

  async getChapter(url: string) {
    const r = await proxyUrl(url);
    const $ = cheerio.load(r);

    return $('#user-content').html();
  }
}

const biuScraper = new BIUScraper();

export default biuScraper;
