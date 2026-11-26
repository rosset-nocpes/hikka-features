import { pageRange, useMangaPage } from '../../../hooks/use-manga-page';
import { useReader } from '../../../hooks/use-reader';
import { ReaderType } from '../../../reader.enums';

/** The page in view out of the chapter's, at the bottom left on desktops. */
const MangaPageIndicator = () => {
  const { settings } = useReader();
  const page = useMangaPage();

  if (settings.type !== ReaderType.Manga || page.pageCount === 0) return;

  return (
    <div
      className={cn(
        'bg-sidebar text-sidebar-foreground absolute bottom-2 left-2 z-20 hidden h-8 cursor-default items-center gap-2 rounded-md px-2 font-medium tabular-nums transition-[bottom,opacity] duration-300 md:flex',
        !settings.showPageNumber && 'pointer-events-none -bottom-8 opacity-0',
      )}
    >
      <div>{pageRange(page)}</div>
      <div className="bg-muted h-full w-[2px]" />
      <div>{page.pageCount}</div>
    </div>
  );
};

export default MangaPageIndicator;
