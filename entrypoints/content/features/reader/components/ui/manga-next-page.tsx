import { CarouselItem } from '@/components/ui/carousel';

import { adjacentChapter } from '../../chapters';
import useReadData from '../../hooks/use-read-data';
import { useReader } from '../../hooks/use-reader';

/** The page after the last one: what was read and what comes next. */
const MangaNextPage = () => {
  const { data } = useReadData();
  const { currentChapter, settings } = useReader();

  if (!data || !currentChapter) return;

  const nextChapterData = adjacentChapter(
    data,
    settings.translator,
    currentChapter,
    1,
  );

  return (
    <>
      <CarouselItem className="flex h-full flex-col items-center justify-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">Закінчено:</div>
          <div>{`Том ${currentChapter?.volume}. Розділ ${currentChapter?.chapter}`}</div>
        </div>
        <div className="flex flex-col gap-1">
          {nextChapterData ? (
            <>
              <div className="text-sm font-medium">Наступний:</div>
              <div>{`Том ${nextChapterData.volume}. Розділ ${nextChapterData.chapter}`}</div>
            </>
          ) : (
            <div className="font-medium">Немає наступного розділу.</div>
          )}
        </div>
      </CarouselItem>
      {nextChapterData && <CarouselItem className="size-full" />}
    </>
  );
};
export default MangaNextPage;
