import MaterialSymbolsArrowForwardRounded from '~icons/material-symbols/arrow-forward-rounded';

import { Button } from '@/components/ui/button';
import { CarouselItem } from '@/components/ui/carousel';

import type { Chapter } from '../../reader.types';

import { adjacentChapter } from '../../chapters';
import useReadData from '../../hooks/use-read-data';
import { useReader } from '../../hooks/use-reader';

const chapterName = (chapter: Chapter) =>
  `${chapter.volume ? `Том ${chapter.volume} · ` : ''}Розділ ${chapter.chapter}`;

/** What was read and what comes next, with a button to open it. */
export const ChapterEnd = ({ className }: { className?: string }) => {
  const { data } = useReadData();
  const { currentChapter, settings, nextChapter } = useReader();

  if (!data || !currentChapter) return;

  const next = adjacentChapter(data, settings.translator, currentChapter, 1);

  return (
    <div
      // Reads left to right inside a carousel read right to left too.
      dir="ltr"
      className={cn(
        'flex flex-col items-center justify-center gap-5 text-center',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium opacity-60">Кінець розділу</span>
        <span className="text-lg font-semibold">
          {chapterName(currentChapter)}
        </span>
      </div>
      {next ? (
        <Button variant="secondary" onClick={nextChapter}>
          Далі: {chapterName(next)}
          <MaterialSymbolsArrowForwardRounded />
        </Button>
      ) : (
        <span className="text-sm font-medium opacity-60">
          Це останній розділ
        </span>
      )}
    </div>
  );
};

/**
 * The slides after the last page: the chapter's end, then, when there is a
 * next chapter, an empty one that opens it as it's scrolled to.
 */
const MangaNextPage = () => {
  const { data } = useReadData();
  const { currentChapter, settings } = useReader();

  if (!data || !currentChapter) return;

  const next = adjacentChapter(data, settings.translator, currentChapter, 1);

  return (
    <>
      <CarouselItem className="h-full">
        <ChapterEnd className="h-full" />
      </CarouselItem>
      {next && <CarouselItem className="size-full" />}
    </>
  );
};

export default MangaNextPage;
