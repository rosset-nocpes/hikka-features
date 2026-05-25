import * as cheerio from 'cheerio';

import type { Chapter, ReaderContent, Volume } from '../reader.types';

import { ReaderContentMode } from '../reader.enums';
import BaseScraper from './_scraper';

class BIUScraper extends BaseScraper {
  name = 'BIUScraper';
  baseUrl = 'https://baka.in.ua';
  endpoints = {
    search: `${this.baseUrl}/search?filter=fiction&search[]`,
  };

  async search(data: any) {
    const titles = [data.title_ua, data.title_en, data.title_original].filter(
      Boolean,
    );

    for (const title of titles) {
      try {
        const r = await this.request(
          `${this.endpoints.search}=${encodeURIComponent(title)}`,
        );

        const $page = cheerio.load(r);
        const novels = $page('#fictions-section .group a.block')
          .map((_i, el) => {
            const $novelElement = $page(el);
            return $novelElement.attr('href');
          })
          .toArray();

        if (novels.length > 0) {
          return novels[0].startsWith('http')
            ? novels[0]
            : `${this.baseUrl}${novels[0]}`;
        }
      } catch (e) {
        console.error(`Failed to search for ${title}`, e);
      }
    }

    throw new Error('No results found');
  }

  async getChapterList(url: string): Promise<ReaderContent> {
    const r = await this.request(url);
    const $ = cheerio.load(r);

    const $accordions = $('.accordion');
    const regex: RegExp = /(?<=- ).*/;

    const hasVolumes = $accordions
      .find('.accordion-header h3')
      .toArray()
      .some((el) => $(el).text().includes('Том'));

    if (hasVolumes) {
      const volumes: Volume[] = [];

      for (const accordion of $accordions.toArray()) {
        const $header = $(accordion).find('.accordion-header');
        const $sectionData = $(accordion).find('[data-chapter-section-url]');
        const headerText = $header.find('h3').text().trim();

        const volumeMatch = headerText.match(/Том\s+(\d+(?:\.\d+)?$)/i);
        const volumeNumber = volumeMatch ? Number(volumeMatch[1]) : 0;

        const sectionUrl = new URL(
          `${this.baseUrl}${$sectionData.attr('data-chapter-section-url')}`,
        );
        const params = JSON.parse(
          $sectionData.attr('data-chapter-section-params') || '{}',
        );
        Object.keys(params).forEach((key) => {
          sectionUrl.searchParams.append(key, params[key]);
        });

        const chaptersPage = await this.request(sectionUrl.toString());
        const $chapters = cheerio.load(chaptersPage);

        const chapters = $chapters('li.group a[href*="/chapters/"]')
          .map((_j, el) => {
            const $link = $chapters(el);
            const chNum = Number($link.find('span').eq(0).text().trim());
            const href = $link.attr('href') || '';
            const translator = $link
              .parent()
              .find('a[href^="/scanlators"]')
              .map((_k, e) => $chapters(e).text().trim())
              .toArray();

            return {
              id: `vol${volumeNumber}-ch${chNum}-${translator.map((t) => t.toLowerCase()).join('_')}`,
              volume: volumeNumber,
              chapter: chNum,
              title:
                $link.find('span').eq(1).text().trim().match(regex)?.[0] || '',
              translator: translator.join(', '),
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
      }

      return {
        displayMode: ReaderContentMode.Volumes,
        volumes: volumes.sort((a, b) => a.number - b.number),
      };
    } else {
      const chapters: Chapter[] = [];

      for (const accordion of $accordions.toArray()) {
        const $sectionData = $(accordion).find('[data-chapter-section-url]');

        const sectionUrl = new URL(
          `${this.baseUrl}${$sectionData.attr('data-chapter-section-url')}`,
        );
        const params = JSON.parse(
          $sectionData.attr('data-chapter-section-params') || '{}',
        );
        Object.keys(params).forEach((key) => {
          sectionUrl.searchParams.append(key, params[key]);
        });

        const chaptersPage = await this.request(sectionUrl.toString());
        const $chapters = cheerio.load(chaptersPage);

        const sectionChapters = $chapters('li.group a[href*="/chapters/"]')
          .map((_j, el) => {
            const $link = $chapters(el);
            const chNum = Number($link.find('span').eq(0).text().trim());
            const href = $link.attr('href') || '';
            const translator = $link
              .parent()
              .find('a[href^="/scanlators"]')
              .map((_k, e) => $chapters(e).text().trim())
              .toArray();

            return {
              id: `ch${chNum}-${translator.map((t) => t.toLowerCase()).join('_')}`,
              chapter: chNum,
              title:
                $link.find('span').eq(1).text().trim().match(regex)?.[0] || '',
              translator: translator.join(', '),
              date_upload: $link.find('span').eq(2).text().trim(),
              url: href.startsWith('http')
                ? href
                : `${this.baseUrl}/${href.replace(/^\//, '')}`,
            };
          })
          .toArray();

        chapters.push(...sectionChapters);
      }

      return {
        displayMode: ReaderContentMode.Chapters,
        chapters: chapters.sort((a, b) => a.chapter - b.chapter),
      };
    }
  }

  async getChapter(url: string) {
    const r = await this.request(url);
    const $ = cheerio.load(r);

    return $('#user-content').html();
  }
}

const biuScraper = new BIUScraper();

export default biuScraper;
