import { FC } from 'react';
import { CarouselItem } from '@/components/ui/carousel';
import { useReaderContext } from './context/reader-context';

const ReaderNextPages: FC = () => {
  const readerContext = useReaderContext();

  const nextChapter =
    readerContext.state.mangaData.chapters[
      readerContext.state.mangaData.chapters.findIndex(
        (chapter) =>
          chapter.chapter === readerContext.state.currentChapter.chapter,
      ) + 1
    ];

  return (
    <>
      <CarouselItem className="flex h-full flex-col items-center justify-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="font-medium text-sm">Закінчено:</div>
          <div>{`Том ${readerContext.state.currentChapter.volume}. Розділ ${readerContext.state.currentChapter.chapter}`}</div>
        </div>
        <div className="flex flex-col gap-1">
          {nextChapter ? (
            <>
              <div className="font-medium text-sm">Наступний:</div>
              <div>{`Том ${nextChapter?.volume}. Розділ ${nextChapter?.chapter}`}</div>
            </>
          ) : (
            <div className="font-medium">Немає наступного розділу.</div>
          )}
        </div>
      </CarouselItem>
      <CarouselItem className="size-full" />
    </>
  );
};
export default ReaderNextPages;
