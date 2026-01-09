import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import MaterialSymbolsArrowDownwardRounded from '~icons/material-symbols/arrow-downward-rounded';
import MaterialSymbolsArrowUpwardRounded from '~icons/material-symbols/arrow-upward-rounded';
import { useReader } from '../../hooks/use-reader';
import { MangaOrientation, ReaderType } from '../../reader.enums';

// todo: add support for novel chapter switching
const PageSwitcher = () => {
  const { settings, carouselApi, nextChapter, prevChapter } = useReader();

  const isManga = settings.type === ReaderType.Manga;
  const isNovel = settings.type === ReaderType.Novel;
  const isVertical =
    isManga && settings.orientation === MangaOrientation.Vertical;
  const isHorizontal =
    (isManga && settings.orientation === MangaOrientation.Horizontal) ||
    isNovel;

  const handleScroll = useCallback(
    (direction: 'next' | 'prev') => {
      if (isManga) {
        if (!carouselApi) return;

        direction === 'next'
          ? carouselApi.scrollNext()
          : carouselApi.scrollPrev();
      }

      if (isNovel) {
        direction === 'next' ? nextChapter() : prevChapter();
      }
    },
    [carouselApi, isManga, isNovel],
  );

  const positionClasses = cn(
    isVertical && 'bottom-1/2 left-2 translate-y-1/2',
    isHorizontal &&
      'bottom-2 left-1/2 -translate-x-1/2 translate-y-1/4 -rotate-90',
  );

  const visibilityClasses = cn(
    isManga && settings.scrollMode
      ? isVertical
        ? '-left-8 opacity-0'
        : '-bottom-8 opacity-0'
      : 'opacity-40 hover:opacity-100',
  );

  if (!settings.type) return;

  return (
    <div
      className={cn(
        'absolute z-20 hidden w-8 cursor-default flex-col items-center justify-center gap-2 rounded-md bg-sidebar py-1 font-medium duration-300 md:flex',
        positionClasses,
        visibilityClasses,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-sm"
        onClick={() => handleScroll('prev')}
        aria-label="Previous Page"
      >
        <MaterialSymbolsArrowUpwardRounded />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-sm"
        onClick={() => handleScroll('next')}
        aria-label="Next Page"
      >
        <MaterialSymbolsArrowDownwardRounded />
      </Button>
    </div>
  );
};

export default PageSwitcher;
