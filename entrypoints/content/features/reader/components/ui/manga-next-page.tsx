import { CarouselItem } from '@/components/ui/carousel';
import useReadData from '../../hooks/use-read-data';
import { useReader } from '../../hooks/use-reader';
import { ReaderContentMode } from '../../reader.enums';

const MangaNextPage = () => {
  const { data } = useReadData();
  const { currentChapter } = useReader();

  if (!data || !currentChapter) return;

  // todo: improve implementation
  const nextChapterData =
    data.displayMode === ReaderContentMode.Chapters
      ? data.chapters[
          data.chapters.findIndex((c) => c.id === currentChapter.id) + 1
        ]
      : data.volumes[
          data.volumes.findIndex((v) => v.number === currentChapter.volume)
        ].chapters[
          data.volumes[
            data.volumes.findIndex((v) => v.number === currentChapter.volume)
          ].chapters.findIndex((c) => c.id === currentChapter.id) + 1
        ];

  return (
    <>
      <CarouselItem className="flex h-full flex-col items-center justify-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="font-medium text-sm">Закінчено:</div>
          <div>{`Том ${currentChapter?.volume}. Розділ ${currentChapter?.chapter}`}</div>
        </div>
        <div className="flex flex-col gap-1">
          {nextChapterData ? (
            <>
              <div className="font-medium text-sm">Наступний:</div>
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
