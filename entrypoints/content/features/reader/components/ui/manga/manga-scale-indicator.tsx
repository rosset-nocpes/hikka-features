import MaterialSymbolsAddRounded from '~icons/material-symbols/add-rounded';
import MaterialSymbolsRemoveRounded from '~icons/material-symbols/remove-rounded';

import { Button } from '@/components/ui/button';

import { mangaMode, useReader } from '../../../hooks/use-reader';
import { STRIP_WIDTH } from '../../../reader.constants';
import { MangaReadingMode, ReaderType } from '../../../reader.enums';

/** Changes the strip's width by `steps`, within its bounds. */
export const zoomStrip = (steps: number) => {
  const { settings, setSettings } = useReader.getState();
  if (settings.type !== ReaderType.Manga) return;

  const stripWidth = Math.min(
    Math.max(settings.stripWidth + steps * STRIP_WIDTH.step, STRIP_WIDTH.min),
    STRIP_WIDTH.max,
  );
  setSettings({ stripWidth });
};

/** The strip's width, with buttons to change it, on desktops. */
const MangaScaleIndicator = () => {
  const { settings } = useReader();
  const isStrip = useReader(mangaMode) === MangaReadingMode.Strip;

  if (settings.type !== ReaderType.Manga) return;

  return (
    <div
      inert={!isStrip}
      className={cn(
        'bg-sidebar text-sidebar-foreground absolute right-2 bottom-2 z-20 hidden h-8 cursor-default items-center gap-1 rounded-md px-1 font-medium tabular-nums transition-[bottom,opacity] duration-300 md:flex',
        !isStrip && 'pointer-events-none -bottom-8 opacity-0',
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-sm"
        aria-label="Вужча стрічка"
        disabled={settings.stripWidth <= STRIP_WIDTH.min}
        onClick={() => zoomStrip(-1)}
      >
        <MaterialSymbolsRemoveRounded className="size-4" />
      </Button>
      <div className="min-w-10 text-center">{settings.stripWidth}%</div>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-sm"
        aria-label="Ширша стрічка"
        disabled={settings.stripWidth >= STRIP_WIDTH.max}
        onClick={() => zoomStrip(1)}
      >
        <MaterialSymbolsAddRounded className="size-4" />
      </Button>
    </div>
  );
};

export default MangaScaleIndicator;
