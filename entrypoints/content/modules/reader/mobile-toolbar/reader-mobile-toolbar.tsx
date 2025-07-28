import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import type { CarouselApi } from '@/components/ui/carousel';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useSidebar } from '@/components/ui/sidebar';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsRightPanelCloseRounded from '~icons/material-symbols/right-panel-close-rounded';
import MaterialSymbolsRightPanelOpenOutlineRounded from '~icons/material-symbols/right-panel-open-outline-rounded';
import { getRead, useReaderContext } from '../context/reader-context';
import reader from '../reader';

interface Props {
  carouselApi: CarouselApi;
}

const ReaderMobileToolbar: FC<Props> = ({ carouselApi }) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const { open, setOpen } = useSidebar();
  const { data: mangaData } = useReadData();
  const { container, currentChapter, setChapter } = useReaderContext();

  const handleSelectChapter = (value: API.ChapterData) => {
    setChapter(value);
    setSheetOpen(false);

    carouselApi?.scrollTo(0, true);
  };

  return (
    <div className="absolute bottom-2 z-20 flex w-full justify-center px-2 sm:hidden">
      <div className="flex gap-2 rounded-lg bg-background/60 p-2 backdrop-blur-xl">
        {/* <Button variant="secondary" size="md" onClick={() => setOpen(!open)}>
          {open ? (
            <MaterialSymbolsRightPanelCloseRounded />
          ) : (
            <MaterialSymbolsRightPanelOpenOutlineRounded />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button> */}
        <Sheet modal={false} open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-secondary bg-secondary px-3 font-medium text-secondary-foreground text-sm ring-offset-background transition-colors hover:bg-secondary/80 focus-visible:outline-none"
            onClick={() => setSheetOpen(true)}
          >{`Том ${currentChapter?.volume} Розділ ${currentChapter?.chapter}`}</SheetTrigger>
          <SheetContent
            container={container}
            side="bottom"
            className="flex h-full flex-col gap-2"
          >
            <SheetHeader>
              <SheetTitle>Оберіть розділ</SheetTitle>
            </SheetHeader>
            <div className="flex h-full flex-col gap-1 overflow-y-auto">
              {mangaData?.chapters.map((chapter, index) => (
                <Button
                  key={chapter.id}
                  variant="ghost"
                  onClick={() => handleSelectChapter(chapter)}
                  className={cn(
                    'w-full shrink-0',
                    index + 1 <= getRead() && 'text-muted-foreground',
                  )}
                >
                  {`Том ${chapter.volume} Розділ ${chapter.chapter}`}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        {/* <Drawer container={container}>
          <DrawerTrigger className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-secondary bg-secondary px-3 font-medium text-secondary-foreground text-sm ring-offset-background transition-colors hover:bg-secondary/80 focus-visible:outline-none">{`Том ${readerContext.state.currentChapter.volume} Розділ ${readerContext.state.currentChapter.chapter}`}</DrawerTrigger>
          <DrawerContent className="flex h-full flex-col gap-2">
            <DrawerHeader>
              <DrawerTitle>Сало</DrawerTitle>
            </DrawerHeader>
            <div className="flex h-full flex-col gap-1 overflow-y-auto">
              {chapters.map((chapter) => (
                <Button
                  key={chapter.id}
                  variant="ghost"
                  onClick={() => handleSelectChapter(chapter)}
                  className="w-full shrink-0"
                >
                  {`Том ${chapter.volume} Розділ ${chapter.chapter}`}
                </Button>
              ))}
            </div>
            <DrawerFooter>
              <DrawerClose>
                <Button variant="outline">Зачинити</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer> */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => reader().then((x) => x.remove())}
        >
          <MaterialSymbolsCloseRounded />
        </Button>
      </div>
    </div>
  );
};

export default ReaderMobileToolbar;
