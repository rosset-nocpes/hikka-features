import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsPageInfoOutlineRounded from '~icons/material-symbols/page-info-outline-rounded';
import useReadData from '../../../hooks/use-read-data';
import { useReader } from '../../../hooks/use-reader';
import reader from '../../../reader';
import { READER_POWERED_BY } from '../../../reader.constants';
import { ReaderContentMode } from '../../../reader.enums';
import { BaseKeys, KeysOfUnion } from '../../../reader.types';
import ChapterList from '../../sidebar/chapter-list';
import { SettingsItems } from '../../sidebar/settings/reader-settings';
import SortOptions from '../../sidebar/sort-options';

const ReaderMobileToolbar = () => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: mangaData } = useReadData();
  const { settings, container, currentChapter } = useReader();

  useEffect(() => {
    setSheetOpen(false);
  }, [currentChapter]);

  return (
    <div className="absolute bottom-2 z-20 flex w-full justify-center px-2 md:hidden">
      <div className="flex gap-2 rounded-lg bg-background/60 p-2 backdrop-blur-xl">
        <Sheet modal={false}>
          <SheetTrigger asChild>
            <Button variant="secondary" size="md">
              <MaterialSymbolsPageInfoOutlineRounded />
            </Button>
          </SheetTrigger>
          <SheetContent
            container={container}
            side="bottom"
            className="flex h-full flex-col gap-2"
          >
            <SheetHeader>
              <SheetTitle>Налаштування</SheetTitle>
            </SheetHeader>
            <SettingsItems />
            <SheetFooter className="flex flex-col text-center text-muted-foreground text-xs">
              <a
                href={READER_POWERED_BY[settings.type]?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1"
              >
                {READER_POWERED_BY[settings.type]?.label}
              </a>
            </SheetFooter>
          </SheetContent>
        </Sheet>
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
              {mangaData?.displayMode === ReaderContentMode.Chapters && (
                <SortOptions />
              )}
            </SheetHeader>
            <div className="flex h-full flex-col gap-1 overflow-y-auto">
              <ChapterList />
            </div>
          </SheetContent>
        </Sheet>
        <Button
          variant="secondary"
          size="md"
          onClick={() => reader(settings.type).then((x) => x.remove())}
        >
          <MaterialSymbolsCloseRounded />
        </Button>
      </div>
    </div>
  );
};

export default ReaderMobileToolbar;
