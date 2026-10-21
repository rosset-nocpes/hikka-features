import { type ReactElement, type ReactNode, useRef, useState } from 'react';
import MaterialSymbolsChevronLeftRounded from '~icons/material-symbols/chevron-left-rounded';
import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsExpandLessRounded from '~icons/material-symbols/expand-less-rounded';
import MaterialSymbolsSettingsOutlineRounded from '~icons/material-symbols/settings-outline-rounded';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

import type { Chapter } from '../../../reader.types';

import { adjacentChapter } from '../../../chapters';
import useReadData from '../../../hooks/use-read-data';
import { useReader } from '../../../hooks/use-reader';
import { closeReader } from '../../../reader';
import { ReaderType } from '../../../reader.enums';
import ChapterList from '../../sidebar/chapter-list';
import { SettingsItems } from '../../sidebar/settings/reader-settings';
import SortOptions from '../../sidebar/sort-options';
import { useMangaPage } from '../manga/manga-page-indicator';

const GLASS = 'bg-background/60 backdrop-blur-xl';

const chapterLabel = (chapter?: Chapter) =>
  chapter
    ? `${chapter.volume ? `Том ${chapter.volume} · ` : ''}Розділ ${chapter.chapter}`
    : '';

/** Scrolls `list` so its active row sits in the middle. */
const centerActiveRow = (list: HTMLElement) => {
  const row = list.querySelector<HTMLElement>('[data-active=true]');
  if (!row) return;

  const rowRect = row.getBoundingClientRect();
  const listRect = list.getBoundingClientRect();
  list.scrollTop +=
    rowRect.top - listRect.top - (listRect.height - rowRect.height) / 2;
};

interface ReaderDrawerProps {
  title: string;
  trigger: ReactElement;
  header?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

/** A bottom drawer of the reader, like the player's on phones. */
const ReaderDrawer = ({
  title,
  trigger,
  header,
  open,
  onOpenChange,
  children,
}: ReaderDrawerProps) => {
  const { container } = useReader();
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(opened) => {
        if (opened && listRef.current) centerActiveRow(listRef.current);
      }}
    >
      <DrawerTrigger render={trigger} />
      <DrawerContent className="h-[80%]" container={container}>
        <DrawerHeader className="gap-3 text-left!">
          <DrawerTitle className="text-lg font-bold">{title}</DrawerTitle>
          {header}
        </DrawerHeader>
        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

/** What the top bar names under the chapter: its page, title or volume. */
const useSubtitle = () => {
  const { settings, currentChapter } = useReader();
  const { currentPage, pageCount } = useMangaPage();

  if (settings.type === ReaderType.Manga && pageCount > 0) {
    return `Сторінка ${currentPage + 1} з ${pageCount}`;
  }
  return currentChapter?.title || currentChapter?.translator;
};

/**
 * The reader's controls on phones: a top bar with the chapter and settings,
 * and a dock to move between chapters. A tap at the page hides both.
 */
const ReaderMobileToolbar = () => {
  const { settings, currentChapter, barsHidden, nextChapter, prevChapter } =
    useReader();
  // The chapter the list was opened on: picking another one closes it.
  const [listOpenedOn, setListOpenedOn] = useState<string>();
  const { data } = useReadData();
  const subtitle = useSubtitle();

  const previous = adjacentChapter(
    data,
    settings.translator,
    currentChapter,
    -1,
  );
  const next = adjacentChapter(data, settings.translator, currentChapter, 1);

  return (
    <div className="md:hidden">
      <div
        className={cn(
          'absolute inset-x-0 top-0 z-20 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] transition-[translate,opacity] duration-300',
          barsHidden && 'pointer-events-none -translate-y-full opacity-0',
        )}
      >
        <div
          className={cn(
            GLASS,
            'border-border/50 flex items-center gap-2 rounded-xl border p-1.5 font-sans',
          )}
        >
          <Button
            variant="ghost"
            size="icon-md"
            aria-label="Закрити читалку"
            onClick={closeReader}
          >
            <MaterialSymbolsCloseRounded className="size-5" />
          </Button>
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-center">
            <span className="truncate text-sm leading-none font-semibold">
              {chapterLabel(currentChapter)}
            </span>
            {subtitle && (
              <span className="truncate text-xs leading-none font-medium text-[#A1A1A1] tabular-nums">
                {subtitle}
              </span>
            )}
          </div>
          <ReaderDrawer
            title="Налаштування"
            trigger={
              <Button variant="ghost" size="icon-md" aria-label="Налаштування">
                <MaterialSymbolsSettingsOutlineRounded className="size-5" />
              </Button>
            }
          >
            <SettingsItems />
          </ReaderDrawer>
        </div>
      </div>

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-20 flex justify-center p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-[translate,opacity] duration-300',
          barsHidden && 'pointer-events-none translate-y-full opacity-0',
        )}
      >
        <div
          className={cn(
            GLASS,
            'border-border/50 flex w-full max-w-md items-center gap-1.5 rounded-xl border p-1.5 font-sans',
          )}
        >
          <Button
            variant="ghost"
            size="icon-md"
            aria-label="Попередній розділ"
            disabled={!previous}
            onClick={prevChapter}
          >
            <MaterialSymbolsChevronLeftRounded className="size-6" />
          </Button>
          <ReaderDrawer
            title="Розділи"
            header={<SortOptions />}
            open={!!currentChapter && listOpenedOn === currentChapter.id}
            onOpenChange={(open) =>
              setListOpenedOn(open ? currentChapter?.id : undefined)
            }
            trigger={
              <Button
                variant="secondary"
                size="md"
                className="min-w-0 flex-1 gap-1 font-semibold"
              >
                <span className="truncate">{chapterLabel(currentChapter)}</span>
                <MaterialSymbolsExpandLessRounded className="text-muted-foreground size-5 shrink-0" />
              </Button>
            }
          >
            <ChapterList />
          </ReaderDrawer>
          <Button
            variant="ghost"
            size="icon-md"
            aria-label="Наступний розділ"
            disabled={!next}
            onClick={nextChapter}
          >
            <MaterialSymbolsChevronRightRounded className="size-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReaderMobileToolbar;
