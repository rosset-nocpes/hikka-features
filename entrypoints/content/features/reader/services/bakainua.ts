import type { Chapter, ReaderContent, Volume } from '../reader.types';

import { ReaderContentMode } from '../reader.enums';
import BaseScraper from './_scraper';

class BIUScraper extends BaseScraper {
  name = 'BIUScraper';
  baseUrl = 'https://baka.in.ua';
  endpoints = {
    search: `${this.baseUrl}/search?search%5B%5D`,
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

        const page = new DOMParser().parseFromString(r, 'text/html');
        const novels = [
          ...page.querySelectorAll('#fictions-section .group a.block'),
        ]
          .map((el) => el.getAttribute('href') || '')
          .filter(Boolean);

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
    const page = new DOMParser().parseFromString(r, 'text/html');

    const accordions = page.querySelectorAll('.accordion');
    const alternativeTabs = page.querySelector('#alternative-tabs');
    const regex: RegExp = /(?<=- ).*/;

    const hasVolumes = [
      ...page.querySelectorAll('.accordion .accordion-header h3'),
    ].some((el) => el.textContent?.includes('Том'));

    const translators = [...page.querySelectorAll('a[href^="/scanlators"]')]
      .map((el) => el.textContent?.trim())
      .filter((t): t is string => Boolean(t));

    let translator =
      translators.length > 1 && !alternativeTabs ? '' : translators[0];

    if (alternativeTabs) {
      const tabsWithSvg = [...alternativeTabs.querySelectorAll('*')].filter(
        (el) => el.querySelector('svg'),
      );

      const selectedTab =
        tabsWithSvg.length > 0 ? tabsWithSvg[0] : alternativeTabs;

      translator = selectedTab.textContent?.trim() ?? '';
    }

    if (hasVolumes) {
      const volumes: Volume[] = [];

      accordions.forEach((accordion, _i) => {
        const content = accordion.querySelector('.accordion-content')!;
        const headerText = accordion
          .querySelector('.accordion-header h3')
          ?.textContent?.trim()!;

        const volumeMatch = headerText.match(/Том\s+(\d+(?:\.\d+)?$)/i);
        const volumeNumber = volumeMatch ? Number(volumeMatch[1]) : 0;

        const chapters = [...content.querySelectorAll('li.group a')].map(
          (el, _j) => {
            const spans = el.querySelectorAll('span');

            const chNum = Number(spans[0].textContent);
            const href = el.getAttribute('href') || '';
            return {
              id: `vol${volumeNumber}-ch${chNum}`,
              volume: volumeNumber,
              chapter: chNum,
              title: spans[1].textContent.trim().match(regex)?.[0] || '',
              translator,
              date_upload: spans[2].textContent.trim().match(regex)?.[0] || '',
              url: href.startsWith('http')
                ? href
                : `${this.baseUrl}/${href.replace(/^\//, '')}`,
            };
          },
        );

        volumes.push({
          number: volumeNumber,
          chapters: chapters.sort((a, b) => a.chapter - b.chapter),
        });
      });

      return {
        displayMode: ReaderContentMode.Volumes,
        volumes: volumes.sort((a, b) => a.number - b.number),
      };
    } else {
      const chapters: Chapter[] = [];

      accordions.forEach((accordion, _i) => {
        const content = accordion.querySelector('.accordion-content')!;

        const accordionChapters = [
          ...content.querySelectorAll('li.group a'),
        ].map((el, _j) => {
          const spans = el.querySelectorAll('span');

          const chNum = Number(spans[0].textContent?.trim());
          const href = el.getAttribute('href') || '';
          return {
            id: `ch${chNum}`,
            chapter: chNum,
            title: spans[1].textContent.trim().match(regex)?.[0] || '',
            translator,
            date_upload: spans[2].textContent.trim(),
            url: href.startsWith('http')
              ? href
              : `${this.baseUrl}/${href.replace(/^\//, '')}`,
          };
        });

        chapters.push(...accordionChapters);
      });

      return {
        displayMode: ReaderContentMode.Chapters,
        chapters: chapters.sort((a, b) => a.chapter - b.chapter),
      };
    }
  }

  async getChapter(url: string) {
    const r = await this.request(url);
    const page = new DOMParser().parseFromString(r, 'text/html');

    return page.querySelector('#user-content')?.innerHTML ?? '';
  }
}

const biuScraper = new BIUScraper();

export default biuScraper;
