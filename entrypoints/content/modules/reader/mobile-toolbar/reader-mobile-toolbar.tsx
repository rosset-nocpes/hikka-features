import { BarChart, Eye, Minus, Plus } from 'lucide-react';
import { FC } from 'react';
import { ContentScriptContext } from '#imports';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { useSidebar } from '@/components/ui/sidebar';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsRightPanelCloseRounded from '~icons/material-symbols/right-panel-close-rounded';
import MaterialSymbolsRightPanelOpenOutlineRounded from '~icons/material-symbols/right-panel-open-outline-rounded';
import { getRead, useReaderContext } from '../context/reader-context';
import reader from '../reader';

interface Props {
  ctx: ContentScriptContext;
  container: HTMLElement;
  title: string;
}

const ReaderMobileToolbar: FC<Props> = ({ ctx, container, title }) => {
  const readerContext = useReaderContext();
  const { open, setOpen } = useSidebar();

  const handleSelectChapter = (value: API.ChapterData) => {
    readerContext.setState((prev) => ({ ...prev, currentChapter: value }));
  };

  return (
    <div className="absolute bottom-2 z-10 flex w-full justify-center px-2 sm:hidden">
      <div className="flex gap-2 rounded-lg bg-background/60 p-2 backdrop-blur-xl">
        <Button variant="secondary" size="md" onClick={() => setOpen(!open)}>
          {open ? (
            <MaterialSymbolsRightPanelCloseRounded />
          ) : (
            <MaterialSymbolsRightPanelOpenOutlineRounded />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <Select
          onValueChange={(value) =>
            handleSelectChapter(
              readerContext.state.mangaData.chapters.find(
                (chap) => chap.id === value,
              )!,
            )
          }
        >
          <SelectTrigger className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-secondary bg-secondary px-3 font-medium text-secondary-foreground text-sm ring-offset-background transition-colors hover:bg-secondary/80 focus-visible:outline-none">
            {`Том ${readerContext.state.currentChapter.volume} Розділ ${readerContext.state.currentChapter.chapter}`}
          </SelectTrigger>
          <SelectContent
            container={container}
            align="center"
            className="w-full"
          >
            {readerContext.state.mangaData.chapters.map((chapter) => (
              <SelectItem key={chapter.id} value={chapter.id}>
                {`Том ${chapter.volume} Розділ ${chapter.chapter}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="secondary"
          size="md"
          onClick={() =>
            reader(ctx, readerContext.state.mangaData, title)!.then((x) =>
              x!.remove(),
            )
          }
        >
          <MaterialSymbolsCloseRounded />
        </Button>
      </div>
    </div>
  );
};

export default ReaderMobileToolbar;
