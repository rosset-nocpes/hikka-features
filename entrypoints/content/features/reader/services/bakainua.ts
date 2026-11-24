import { BAKA_IN_UA_URL } from '@/constants/links';

import type {
  Chapter,
  ReaderContent,
  TitleInfo,
  Volume,
} from '../reader.types';

import { ReaderContentMode } from '../reader.enums';
import BaseScraper, { textOf } from './_scraper';

const normalizeTitle = (title: string) =>
  title
    .normalize('NFKC')
    .toLocaleLowerCase('uk-UA')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * How well a search result's titles match the title's: the best share of
 * words two titles have in common, also trying the parts of "A — B" titles.
 */
const titleScore = (candidates: string[], titles: string[]) => {
  const candidateVariants = candidates.flatMap((candidate) => [
    candidate,
    ...candidate.split(/\s+(?:[-–—―:|/])\s+/),
  ]);
  let bestScore = 0;

  for (const candidate of candidateVariants) {
    const candidateWords = new Set(normalizeTitle(candidate).split(' '));

    for (const title of titles) {
      const titleWords = new Set(normalizeTitle(title).split(' '));
      const sharedWords = [...candidateWords].filter((word) =>
        titleWords.has(word),
      ).length;
      const totalWords = new Set([...candidateWords, ...titleWords]).size;

      bestScore = Math.max(bestScore, sharedWords / totalWords);
    }
  }

  return bestScore;
};

class BIUScraper extends BaseScraper {
  constructor() {
    super('BIUScraper', BAKA_IN_UA_URL);
  }

  async search(data: TitleInfo) {
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
        const page = await this.load(
          `search?filter=fiction&search[]=${encodeURIComponent(title)}`,
        );

        for (const link of page.querySelectorAll(
          '#fictions-section .group a.block',
        )) {
          const href = link.getAttribute('href');
          const candidateTitles = [
            ...(link.parentElement?.querySelectorAll('h3, p') ?? []),
          ]
            .map((element) => element.textContent?.trim() ?? '')
            .filter(Boolean);
          const score = titleScore(candidateTitles, titles);

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
    const page = await this.load(url);
    const accordions = [...page.querySelectorAll('.accordion')];

    const hasVolumes = accordions.some((accordion) =>
      [...accordion.querySelectorAll('.accordion-header h3')].some((header) =>
        header.textContent?.includes('Том'),
      ),
    );

    const volumes: Volume[] = [];
    const chapters: Chapter[] = [];

    for (const accordion of accordions) {
      const headerText = textOf(accordion, '.accordion-header h3');
      const volumeMatch = headerText.match(/^Том\s+(\d+(?:\.\d+)?)/i);
      const volumeNumber = volumeMatch ? Number(volumeMatch[1]) : 0;

      const pagers = [
        ...accordion.querySelectorAll('[data-chapter-group-pager-url-value]'),
      ];
      const pager = pagers[0];
      const sectionUrl =
        accordion
          .querySelector('[data-chapter-section-url]')
          ?.getAttribute('data-chapter-section-url') ||
        pager?.getAttribute('data-chapter-group-pager-url-value');
      const isFullyLoaded =
        !!pager &&
        pagers.reduce(
          (count, element) =>
            count + element.querySelectorAll('li.group').length,
          0,
        ) >= Number(pager.getAttribute('data-chapter-group-pager-total-value'));

      const accChapters =
        sectionUrl && !isFullyLoaded
          ? await this.fetchSectionChapters(sectionUrl, volumeNumber)
          : this.parseChaptersFromElements(accordion, volumeNumber);

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
    const page = await this.load(url);
    return page.querySelector('#user-content')?.innerHTML ?? null;
  }

  private parseChaptersFromElements(
    root: ParentNode,
    volumeNumber: number,
  ): Chapter[] {
    return [...root.querySelectorAll('li.group')].flatMap((row) => {
      const link = row.querySelector('a[href*="/chapters/"]');
      const href = link?.getAttribute('href');

      if (!link || !href) return [];

      const chNum = Number(
        row.querySelector('span')?.textContent?.trim() ?? '',
      );
      const translator = [
        ...row.querySelectorAll('a[href^="/scanlators"]'),
      ].map((element) => element.textContent?.trim() ?? '');

      const translatorKey = translator.map((t) => t.toLowerCase()).join('_');
      const id = volumeNumber
        ? `vol${volumeNumber}-ch${chNum}-${translatorKey}`
        : `ch${chNum}-${translatorKey}`;

      return {
        id,
        volume: volumeNumber,
        chapter: chNum,
        title:
          link
            .querySelectorAll('span')[1]
            ?.textContent?.trim()
            .match(/^Розділ\s+\S+\s+—\s+(.*)$/s)?.[1] || '',
        translator: translator.join(', '),
        date_upload:
          row
            .querySelector('p')
            ?.textContent?.match(/\d{2}\.\d{2}\.\d{4}/)?.[0] || '',
        url: this.resolveUrl(href),
      };
    });
  }

  private async fetchSectionChapters(
    sectionPath: string,
    volumeNumber: number,
  ): Promise<Chapter[]> {
    const sectionUrl = new URL(sectionPath, this.baseUrl);
    sectionUrl.searchParams.set('limit', 'all');

    const section = await this.load(sectionUrl.toString());
    return this.parseChaptersFromElements(section.body, volumeNumber);
  }
}

export const biuScraper = new BIUScraper();
