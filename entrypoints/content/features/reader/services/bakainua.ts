import * as cheerio from 'cheerio';

import type { Chapter, ReaderContent, Volume } from '../reader.types';

import { ReaderContentMode } from '../reader.enums';
import BaseScraper from './_scraper';

class BIUScraper extends BaseScraper {
  name = 'BIUScraper';
  baseUrl = 'https://baka.in.ua';
  endpoints = {
    search: `${this.baseUrl}/search`,
  };

  async search(data: any) {
    const titles = [
      ...new Set(
        [data.title_ua, data.title_en, data.title_original]
          .map((t) => t?.trim())
          .filter((t): t is string => Boolean(t)),
      ),
    ];
    let bestMatch: { href: string; score: number } | undefined;

    for (const title of titles) {
      try {
        const r = await this.request(
          `${this.endpoints.search}?filter=fiction&search[]=${encodeURIComponent(title)}`,
        );
        const $page = cheerio.load(r);

        for (const link of $page(
          '#fictions-section .group a.block',
        ).toArray()) {
          const $link = $page(link);
          const href = $link.attr('href');
          const candidateTitles = $link
            .parent()
            .find('h3, p')
            .map((_index, element) => $page(element).text().trim())
            .toArray()
            .filter(Boolean);
          const score = this.getTitleScore(candidateTitles, titles);

          if (href && score > (bestMatch?.score ?? 0)) {
            bestMatch = { href, score };
          }
        }

        if (bestMatch?.score === 1) {
          return this.resolveUrl(bestMatch.href);
        }
      } catch (e) {
        console.error(`Failed to search for ${title}`, e);
      }
    }

    if (bestMatch) {
      return this.resolveUrl(bestMatch.href);
    }

    throw new Error('No results found');
  }

  async getChapterList(url: string): Promise<ReaderContent> {
    const r = await this.request(url);
    const $ = cheerio.load(r);
    const $accordions = $('.accordion');

    const hasVolumes = $accordions
      .find('.accordion-header h3')
      .toArray()
      .some((el) => $(el).text().includes('Том'));

    const volumes: Volume[] = [];
    const chapters: Chapter[] = [];

    for (const accordion of $accordions.toArray()) {
      const $acc = $(accordion);
      const headerText = $acc.find('.accordion-header h3').text().trim();
      const volumeMatch = headerText.match(/^Том\s+(\d+(?:\.\d+)?)/i);
      const volumeNumber = volumeMatch ? Number(volumeMatch[1]) : 0;

      const $pager = $acc.find('[data-chapter-group-pager-url-value]');
      const sectionUrl =
        $acc
          .find('[data-chapter-section-url]')
          .attr('data-chapter-section-url') ||
        $pager.attr('data-chapter-group-pager-url-value');
      const isFullyLoaded =
        $pager.length > 0 &&
        $pager.find('li.group').length >=
          Number($pager.attr('data-chapter-group-pager-total-value'));

      const accChapters =
        sectionUrl && !isFullyLoaded
          ? await this.fetchSectionChapters(sectionUrl, volumeNumber)
          : this.parseChaptersFromElements($, $acc, volumeNumber);

      accChapters.sort((a, b) => a.chapter - b.chapter);

      if (hasVolumes) {
        volumes.push({ number: volumeNumber, chapters: accChapters });
      } else {
        chapters.push(...accChapters);
      }
    }

    return hasVolumes
      ? {
          displayMode: ReaderContentMode.Volumes,
          volumes: volumes.sort((a, b) => a.number - b.number),
        }
      : {
          displayMode: ReaderContentMode.Chapters,
          chapters: chapters.sort((a, b) => a.chapter - b.chapter),
        };
  }

  async getChapter(url: string) {
    const r = await this.request(url);
    const $ = cheerio.load(r);

    return $('#user-content').html();
  }

  private getTitleScore(candidates: string[], titles: string[]): number {
    const candidateVariants = candidates.flatMap((candidate) => [
      candidate,
      ...candidate.split(/\s+(?:[-–—―:|/])\s+/),
    ]);
    let bestScore = 0;

    for (const candidate of candidateVariants) {
      const candidateWords = new Set(this.normalizeTitle(candidate).split(' '));

      for (const title of titles) {
        const titleWords = new Set(this.normalizeTitle(title).split(' '));
        const sharedWords = [...candidateWords].filter((word) =>
          titleWords.has(word),
        ).length;
        const totalWords = new Set([...candidateWords, ...titleWords]).size;

        bestScore = Math.max(bestScore, sharedWords / totalWords);
      }
    }

    return bestScore;
  }

  private normalizeTitle(title: string): string {
    return title
      .normalize('NFKC')
      .toLocaleLowerCase('uk-UA')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  private resolveUrl(href: string): string {
    return href.startsWith('http')
      ? href
      : `${this.baseUrl}/${href.replace(/^\//, '')}`;
  }

  private parseChaptersFromElements(
    $: cheerio.CheerioAPI,
    $root: cheerio.Cheerio<any>,
    volumeNumber: number = 0,
  ): Chapter[] {
    return $root
      .find('li.group')
      .toArray()
      .flatMap((el) => {
        const $row = $(el);
        const $link = $row.find('a[href*="/chapters/"]').first();
        const href = $link.attr('href');

        if (!href) return [];

        const chNum = Number($row.find('span').first().text().trim());
        const translator = $row
          .find('a[href^="/scanlators"]')
          .map((_k, e) => $(e).text().trim())
          .toArray();

        const translatorKey = translator.map((t) => t.toLowerCase()).join('_');
        const id = volumeNumber
          ? `vol${volumeNumber}-ch${chNum}-${translatorKey}`
          : `ch${chNum}-${translatorKey}`;

        return {
          id,
          volume: volumeNumber,
          chapter: chNum,
          title:
            $link
              .find('span')
              .eq(1)
              .text()
              .trim()
              .match(/^Розділ\s+\S+\s+—\s+(.*)$/s)?.[1] || '',
          translator: translator.join(', '),
          date_upload:
            $row
              .find('p')
              .first()
              .text()
              .match(/\d{2}\.\d{2}\.\d{4}/)?.[0] || '',
          url: this.resolveUrl(href),
        };
      });
  }

  private async fetchSectionChapters(
    sectionPath: string,
    volumeNumber: number = 0,
  ): Promise<Chapter[]> {
    const sectionUrl = new URL(sectionPath, this.baseUrl);
    sectionUrl.searchParams.set('limit', 'all');

    const chaptersPage = await this.request(sectionUrl.toString());
    const $chapters = cheerio.load(chaptersPage);
    return this.parseChaptersFromElements(
      $chapters,
      $chapters('body'),
      volumeNumber,
    );
  }
}

const biuScraper = new BIUScraper();

export default biuScraper;
