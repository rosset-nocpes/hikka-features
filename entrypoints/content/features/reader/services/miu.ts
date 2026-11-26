import { MANGA_IN_UA_URL } from '@/constants/links';

import type { Chapter, ReaderContent, TitleInfo } from '../reader.types';

import { ReaderContentMode } from '../reader.enums';
import BaseScraper from './_scraper';

const CHAPTERS_ENDPOINT = 'engine/ajax/controller.php?mod=mgchapters';

/** A chapter as the site's `mgchapters` endpoint lists it. */
interface MiuChapter {
  id: number;
  tom: string;
  num: string;
  name: string;
  link: string;
  /** Unix seconds. */
  date: number;
  team: string;
  /** Another team's translation of a chapter that already has one. */
  alt: boolean;
}

/** `dd.mm.yyyy`, the form the reader sorts dates by. */
const formatDate = (seconds: number) => {
  const date = new Date(seconds * 1000);
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
    .map((part) => String(part).padStart(2, '0'))
    .join('.');
};

class MIUScraper extends BaseScraper {
  constructor() {
    super('MIUScraper', MANGA_IN_UA_URL);
  }

  async search(data: TitleInfo) {
    const linked = data.external?.find(
      (link) => link.text === 'Manga.in.ua',
    )?.url;
    if (linked) return linked;

    const titles = [
      ...new Set(
        [data.title_ua, data.title_en, data.title_original]
          .map((title) => title?.trim())
          .filter((title): title is string => Boolean(title)),
      ),
    ];
    if (!titles.length) throw new Error('The title has no name to search by.');

    let fallback: string | undefined;

    for (const title of titles) {
      const page = await this.load(
        `index.php?do=search&story=${encodeURIComponent(title)}`,
      );
      const cards = [...page.querySelectorAll('.sp-grid article.card')].map(
        (card) => ({
          href: card.querySelector('.card__title a')?.getAttribute('href'),
          year: Number(
            card.querySelector('.sp-meta')?.textContent?.match(/\d{4}/)?.[0],
          ),
        }),
      );
      const match = cards.find((card) => card.href && card.year === data.year);
      if (match?.href) return this.resolveUrl(match.href);

      fallback ??= cards.find((card) => card.href)?.href ?? undefined;
    }

    if (!fallback) throw new Error(`Manga "${titles[0]}" not found.`);
    return this.resolveUrl(fallback);
  }

  /** The title's id, from its address or, failing that, its page. */
  private async newsId(url: string) {
    const fromUrl = url.match(/\/(\d+)-[^/]*\.html/)?.[1];
    if (fromUrl) return fromUrl;

    const html = await this.request(url);
    const fromPage = html.match(/dle_news_id\s*=\s*'(\d+)'/)?.[1];
    if (!fromPage) throw new Error(`Could not find the title id on ${url}.`);
    return fromPage;
  }

  async getChapterList(url: string): Promise<ReaderContent> {
    const response = await this.request(
      CHAPTERS_ENDPOINT,
      'POST',
      new URLSearchParams({ news_id: await this.newsId(url) }),
    );
    const list = (JSON.parse(response) as { chapters?: MiuChapter[] }).chapters;

    // One translation per chapter, as the site shows it: the main one, or
    // whichever there is.
    const main = new Set(list?.filter((c) => !c.alt).map((c) => c.num));
    const chapters: Chapter[] = (list ?? [])
      .filter((c) => !c.alt || !main.has(c.num))
      .map((c) => ({
        id: String(c.id),
        translator: c.team || '',
        date_upload: formatDate(c.date),
        volume: Number(c.tom) || 0,
        chapter: Number(c.num) || 0,
        title: c.name || '',
        url: this.resolveUrl(c.link),
      }));

    return { displayMode: ReaderContentMode.Chapters, chapters };
  }

  /** The chapter's page images. */
  async getChapter(url: string) {
    const page = await this.load(url);
    return [...page.querySelectorAll('[data-reader] figure.rp img')].flatMap(
      (img) => {
        const src = img.getAttribute('src');
        return src ? this.resolveUrl(src) : [];
      },
    );
  }
}

export const miuScraper = new MIUScraper();
