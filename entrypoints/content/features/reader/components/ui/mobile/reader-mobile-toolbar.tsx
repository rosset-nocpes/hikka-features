import { useEffect, useState } from 'react';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsPageInfoOutlineRounded from '~icons/material-symbols/page-info-outline-rounded';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import useReadData from '../../../hooks/use-read-data';
import { useReader } from '../../../hooks/use-reader';
import reader from '../../../reader';
import { READER_POWERED_BY } from '../../../reader.constants';
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
      <div className="bg-background/60 flex gap-2 rounded-lg p-2 backdrop-blur-xl">
        <Sheet modal={false}>
          <SheetTrigger
            render={
              <Button variant="secondary" size="md">
                <MaterialSymbolsPageInfoOutlineRounded />
              </Button>
            }
          />
          <SheetContent
            container={container}
            side="bottom"
            className="flex h-full flex-col gap-2"
          >
            <SheetHeader>
              <SheetTitle>Налаштування</SheetTitle>
            </SheetHeader>
            <SettingsItems />
            <SheetFooter className="text-muted-foreground flex flex-col text-center text-xs">
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
            className="border-secondary bg-secondary text-secondary-foreground ring-offset-background hover:bg-secondary/80 inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-hidden"
            onClick={() => setSheetOpen(true)}
          >{`Том ${currentChapter?.volume} Розділ ${currentChapter?.chapter}`}</SheetTrigger>
          <SheetContent
            container={container}
            side="bottom"
            className="flex h-full flex-col gap-2"
          >
            <SheetHeader>
              <SheetTitle>Оберіть розділ</SheetTitle>
              <SortOptions />
            </SheetHeader>
            <div className="flex h-full flex-col gap-1 overflow-y-auto">
              <ChapterList />
            </div>
          </SheetContent>
        </Sheet>
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
