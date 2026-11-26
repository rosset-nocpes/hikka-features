import MaterialSymbolsArrowDownwardRounded from '~icons/material-symbols/arrow-downward-rounded';
import MaterialSymbolsArrowUpwardRounded from '~icons/material-symbols/arrow-upward-rounded';

import { Button } from '@/components/ui/button';

import { mangaMode, useReader } from '../../hooks/use-reader';
import { MangaReadingMode, ReaderType } from '../../reader.enums';

/** Arrows to page through manga, or between a novel's chapters. */
const PageSwitcher = () => {
  const { settings, turnPage, nextChapter, prevChapter } = useReader();
  const mode = useReader(mangaMode);

  if (!settings.type) return;

  const isManga = settings.type === ReaderType.Manga;
  // Novels page sideways, as manga read left to right does.
  const isVertical = mode === MangaReadingMode.Vertical;
  const isRtl = mode === MangaReadingMode.RightToLeft;
  const isStrip = mode === MangaReadingMode.Strip;

  const handleScroll = (offset: 1 | -1) => {
    if (isManga) turnPage(offset);
    else if (offset === 1) nextChapter();
    else prevChapter();
  };

  // Turned on its side, "back" points the way pages come from.
  const positionClasses = isVertical
    ? 'bottom-1/2 left-2 translate-y-1/2'
    : cn(
        'bottom-2 left-1/2 -translate-x-1/2 translate-y-1/4',
        isRtl ? 'rotate-90' : '-rotate-90',
      );

  const visibilityClasses = isStrip
    ? 'pointer-events-none -bottom-8 opacity-0'
    : 'opacity-40 hover:opacity-100';

  return (
    <div
      inert={isStrip}
      className={cn(
        'bg-sidebar text-sidebar-foreground absolute z-20 hidden w-8 cursor-default flex-col items-center justify-center gap-2 rounded-md py-1 font-medium transition-[bottom,left,opacity,rotate] duration-300 md:flex',
        positionClasses,
        visibilityClasses,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-sm"
        onClick={() => handleScroll(-1)}
        aria-label={isManga ? 'Попередня сторінка' : 'Попередній розділ'}
      >
        <MaterialSymbolsArrowUpwardRounded />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-sm"
        onClick={() => handleScroll(1)}
        aria-label={isManga ? 'Наступна сторінка' : 'Наступний розділ'}
      >
        <MaterialSymbolsArrowDownwardRounded />
      </Button>
    </div>
  );
};

export default PageSwitcher;
