import { ReaderType } from '../reader.enums';
import { biuScraper } from './bakainua';
import { miuScraper } from './miu';

/** The site a title is read from: manga on manga.in.ua, novels on baka.in.ua. */
export const scraperFor = (type: ReaderType | ContentType) =>
  type === ReaderType.Manga ? miuScraper : biuScraper;
