import type {
  Chapter,
  ReaderContent,
  ReaderSettings,
  Volume,
} from './reader.types';

import { ReaderContentMode, ReaderOrderBy, ReaderSortBy } from './reader.enums';

type SortBy = ReaderSettings['sortBy'];

/** Chapters list their translators as "A, B". */
const translatorsOfChapter = (chapter: Chapter) =>
  chapter.translator
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const byTranslator = (translator: string) => (chapter: Chapter) =>
  !translator || translatorsOfChapter(chapter).includes(translator);

/** Upload dates read "dd.mm.yyyy". */
const uploadTime = (chapter: Chapter) =>
  new Date(chapter.date_upload.split('.').reverse().join('-')).getTime();

const direction = ({ order }: SortBy) =>
  order === ReaderOrderBy.Ascending ? 1 : -1;

export const allChapters = (data: ReaderContent | undefined) =>
  !data
    ? []
    : data.displayMode === ReaderContentMode.Chapters
      ? data.chapters
      : data.volumes.flatMap((volume) => volume.chapters);

/** Every translator of the content, alphabetically. */
export const translatorsOf = (data: ReaderContent | undefined) =>
  [...new Set(allChapters(data).flatMap(translatorsOfChapter))].sort((a, b) =>
    a.localeCompare(b),
  );

/** The chapters `translator` worked on, sorted as the list shows them. */
export const sortChapters = (
  chapters: Chapter[],
  sortBy: SortBy,
  translator: string,
) =>
  chapters
    .filter(byTranslator(translator))
    .sort(
      (a, b) =>
        (sortBy.field === ReaderSortBy.DateUpload
          ? uploadTime(a) - uploadTime(b)
          : a.chapter - b.chapter) * direction(sortBy),
    );

/** Volumes with their chapters sorted, without the ones left empty. */
export const sortVolumes = (
  volumes: Volume[],
  sortBy: SortBy,
  translator: string,
) =>
  volumes
    .map((volume) => ({
      ...volume,
      chapters: sortChapters(volume.chapters, sortBy, translator),
    }))
    .filter((volume) => volume.chapters.length > 0)
    .sort(
      (a, b) =>
        (sortBy.field === ReaderSortBy.DateUpload
          ? uploadTime(a.chapters[0]!) - uploadTime(b.chapters[0]!)
          : a.number - b.number) * direction(sortBy),
    );

/**
 * The chapter `offset` away from `current` in reading order, which is the
 * sources' order (volume by volume) whatever the list is sorted by.
 */
export const adjacentChapter = (
  data: ReaderContent | undefined,
  translator: string,
  current: Chapter | undefined,
  offset: 1 | -1,
) => {
  const chapters = allChapters(data).filter(byTranslator(translator));
  const index = chapters.findIndex((chapter) => chapter.id === current?.id);
  return index === -1 ? undefined : chapters[index + offset];
};
