import type { ReactElement, ReactNode } from 'react';

import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import MaterialSymbolsRestartAltRounded from '~icons/material-symbols/restart-alt-rounded';
import MaterialSymbolsTuneRounded from '~icons/material-symbols/tune-rounded';

import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NEW_TAB } from '@/utils/hikka-router';

import type {
  MangaSettings,
  NovelSettings,
  ReaderSettings as Settings,
} from '../../../reader.types';

import { isSideways, mangaMode, useReader } from '../../../hooks/use-reader';
import {
  MANGA_BACKGROUNDS,
  NOVEL_FONT_SIZE,
  NOVEL_FONTS,
  NOVEL_LINE_HEIGHT,
  NOVEL_TEXT_WIDTHS,
  NOVEL_THEMES,
  READER_POWERED_BY,
  READING_MODES,
  STRIP_WIDTH,
} from '../../../reader.constants';
import { MangaReadingMode, ReaderType } from '../../../reader.enums';
import { SHARED_DEFAULTS, TYPE_DEFAULTS } from '../../../reader.preferences';
import {
  OptionList,
  Section,
  SegmentedRow,
  SliderRow,
  SwitchRow,
  Tiles,
} from './controls';
import ModeGlyph from './mode-glyph';

const canKeepAwake =
  typeof navigator !== 'undefined' && 'wakeLock' in navigator;

/** What the settings button says is set: the way manga reads, a novel's font. */
const summary = (settings: Settings, mode: MangaReadingMode | undefined) => {
  if (settings.type === ReaderType.Manga) {
    return READING_MODES.find(({ value }) => value === mode)?.label;
  }
  if (settings.type === ReaderType.Novel) {
    const font = NOVEL_FONTS.find(({ value }) => value === settings.fontFamily);
    return `${font?.label ?? ''} · ${settings.fontSize} px`;
  }
  return undefined;
};

/** Whether the menu's choices are all as they first were. */
const isDefault = (settings: Settings) => {
  if (!settings.type) return true;
  const defaults: Record<string, unknown> = {
    ...TYPE_DEFAULTS[settings.type],
    keepAwake: SHARED_DEFAULTS.keepAwake,
  };
  return Object.entries(defaults).every(
    ([key, value]) => settings[key as keyof Settings] === value,
  );
};

const MangaPanel = ({ settings }: { settings: MangaSettings }) => {
  const { setSettings, pickReadingMode, longPages, modePicked } = useReader();
  const mode = useReader(mangaMode)!;
  const isMobile = useIsMobile();
  const isStrip = mode === MangaReadingMode.Strip;
  const stripForced =
    settings.autoStrip &&
    longPages &&
    !modePicked &&
    settings.readingMode !== mode;

  return (
    <>
      <Section title="Режим читання">
        <div className="flex flex-col gap-2.5 p-2 pb-3">
          <Tiles
            label="Режим читання"
            value={mode}
            options={READING_MODES.map((option) => ({
              ...option,
              preview: <ModeGlyph mode={option.value} />,
            }))}
            onValueChange={pickReadingMode}
          />
          <p
            className="text-muted-foreground px-1 text-xs leading-snug text-pretty"
            aria-live="polite"
          >
            {stripForced
              ? 'Сторінки цього розділу довгі, тож він показаний стрічкою. Оберіть інший режим, щоб читати по сторінці.'
              : READING_MODES.find(({ value }) => value === mode)?.description}
          </p>
        </div>
        <SwitchRow
          label="Стрічка для манхви"
          description="Розділи з довгими сторінками відкриваються стрічкою"
          checked={settings.autoStrip}
          onCheckedChange={(autoStrip) => setSettings({ autoStrip })}
        />
      </Section>

      <Section title="Сторінки">
        {isSideways(mode) && !isMobile && (
          <SwitchRow
            key="double"
            label="Розворот"
            description="Дві сторінки поруч, як у паперовій книжці"
            checked={settings.doublePage}
            onCheckedChange={(doublePage) => setSettings({ doublePage })}
          />
        )}
        {isSideways(mode) && !isMobile && settings.doublePage && (
          <SwitchRow
            key="cover"
            label="Обкладинка окремо"
            description="Вимкніть, якщо розвороти зсунуті на сторінку"
            checked={settings.coverAlone}
            onCheckedChange={(coverAlone) => setSettings({ coverAlone })}
          />
        )}
        {isStrip && !isMobile && (
          <SliderRow
            key="width"
            label="Ширина стрічки"
            value={settings.stripWidth}
            {...STRIP_WIDTH}
            format={(value) => `${value}%`}
            onValueChange={(stripWidth) => setSettings({ stripWidth })}
          />
        )}
        {isStrip && (
          <SwitchRow
            key="gaps"
            label="Проміжки між сторінками"
            checked={settings.stripGaps}
            onCheckedChange={(stripGaps) => setSettings({ stripGaps })}
          />
        )}
        <div key="background" className="flex flex-col gap-2 px-3 pt-2.5 pb-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Фон</span>
            <span className="text-muted-foreground text-xs font-medium">
              {
                MANGA_BACKGROUNDS.find(
                  ({ value }) => value === settings.background,
                )?.label
              }
            </span>
          </div>
          <Tiles
            label="Фон"
            showLabels={false}
            value={settings.background}
            options={MANGA_BACKGROUNDS.map((option) => ({
              ...option,
              preview: (
                <span className="h-7 w-5 rounded-[3px] border border-current/25 bg-current/15" />
              ),
            }))}
            onValueChange={(background) => setSettings({ background })}
          />
        </div>
      </Section>

      <Section title="Керування">
        {!isStrip && (
          <SwitchRow
            key="tap"
            label={isMobile ? 'Гортання дотиком' : 'Гортання кліком'}
            description={
              isMobile
                ? 'Дотик до краю сторінки гортає її, посередині — ховає панелі'
                : 'Клік по лівому чи правому краю сторінки гортає її'
            }
            checked={settings.tapToTurn}
            onCheckedChange={(tapToTurn) => setSettings({ tapToTurn })}
          />
        )}
        {!isMobile && (
          <SwitchRow
            key="page"
            label="Номер сторінки"
            checked={settings.showPageNumber}
            onCheckedChange={(showPageNumber) =>
              setSettings({ showPageNumber })
            }
          />
        )}
        {canKeepAwake && <KeepAwakeRow key="awake" />}
      </Section>
    </>
  );
};

const NovelPanel = ({ settings }: { settings: NovelSettings }) => {
  const { setSettings } = useReader();
  const isMobile = useIsMobile();

  return (
    <>
      <Section title="Шрифт">
        <OptionList
          label="Шрифт"
          value={settings.fontFamily}
          options={NOVEL_FONTS}
          optionClassName={({ value }) => value}
          onValueChange={(fontFamily) => setSettings({ fontFamily })}
        />
      </Section>

      <Section title="Текст">
        <SliderRow
          label="Розмір"
          value={settings.fontSize}
          {...NOVEL_FONT_SIZE}
          format={(value) => `${value} px`}
          start={<span className="text-xs font-semibold">A</span>}
          end={<span className="text-lg leading-none font-semibold">A</span>}
          onValueChange={(fontSize) => setSettings({ fontSize })}
        />
        <SliderRow
          label="Міжрядковий інтервал"
          value={settings.lineHeight}
          {...NOVEL_LINE_HEIGHT}
          format={(value) => value.toFixed(2)}
          onValueChange={(lineHeight) => setSettings({ lineHeight })}
        />
        {!isMobile && (
          <SegmentedRow
            label="Ширина рядка"
            value={settings.textWidth}
            options={NOVEL_TEXT_WIDTHS}
            onValueChange={(textWidth) => setSettings({ textWidth })}
          />
        )}
        <SwitchRow
          label="Вирівнювання за шириною"
          description="Рівні краї рядків, з переносами слів"
          checked={settings.justify}
          onCheckedChange={(justify) => setSettings({ justify })}
        />
      </Section>

      <Section title="Тема">
        <div className="flex flex-col gap-2 px-3 pt-2.5 pb-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Кольори сторінки</span>
            <span className="text-muted-foreground text-xs font-medium">
              {
                NOVEL_THEMES.find(({ value }) => value === settings.theme)
                  ?.label
              }
            </span>
          </div>
          <Tiles
            label="Тема"
            showLabels={false}
            value={settings.theme}
            options={NOVEL_THEMES.map((option) => ({
              ...option,
              className: cn('bg-background text-foreground', option.value),
              preview: (
                <span
                  className={cn('text-base font-medium', settings.fontFamily)}
                >
                  Aa
                </span>
              ),
            }))}
            onValueChange={(theme) => setSettings({ theme })}
          />
        </div>
      </Section>

      {canKeepAwake && (
        <Section title="Загальні">
          <KeepAwakeRow />
        </Section>
      )}
    </>
  );
};

const KeepAwakeRow = () => {
  const { settings, setSettings } = useReader();

  return (
    <SwitchRow
      label="Не вимикати екран"
      description="Екран не гасне, поки відкрита читалка"
      checked={settings.keepAwake}
      onCheckedChange={(keepAwake) => setSettings({ keepAwake })}
    />
  );
};

/** The open type's settings, with a reset and the source's credit. */
export const ReaderSettingsPanel = () => {
  const { settings, resetSettings, modePicked } = useReader();
  const poweredBy = settings.type
    ? READER_POWERED_BY[settings.type]
    : undefined;

  if (!settings.type) return null;

  return (
    <div className="flex flex-col gap-4">
      {settings.type === ReaderType.Manga ? (
        <MangaPanel settings={settings} />
      ) : (
        <NovelPanel settings={settings} />
      )}
      <div className="flex items-center justify-between gap-3 px-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground -ml-1 gap-1.5"
          // A mode picked this time also stops long pages showing as a strip.
          disabled={isDefault(settings) && !modePicked}
          onClick={resetSettings}
        >
          <MaterialSymbolsRestartAltRounded />
          Скинути
        </Button>
        {poweredBy && (
          <a
            href={poweredBy.url}
            {...NEW_TAB}
            className="text-muted-foreground hover:text-foreground truncate text-xs font-medium transition-colors"
          >
            {poweredBy.label}
          </a>
        )}
      </div>
    </div>
  );
};

interface PopoverProps {
  trigger: ReactElement;
  side: 'left' | 'bottom';
}

/** The settings in a popover beside `trigger`, on desktops. */
export const ReaderSettingsPopover = ({ trigger, side }: PopoverProps) => {
  const { container } = useReader();

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        aria-label="Налаштування читалки"
        className="w-80 gap-0 overflow-hidden rounded-xl p-0"
        side={side}
        align="end"
        sideOffset={side === 'left' ? 12 : 8}
        collisionPadding={8}
        container={container}
      >
        <ScrollArea
          className="max-h-[min(var(--available-height),42rem)]"
          scrollFade
        >
          {/* Measured as rows come and go with the mode, not only on scroll. */}
          <ScrollAreaPrimitive.Content className="p-3" style={{ minWidth: 0 }}>
            <ReaderSettingsPanel />
          </ScrollAreaPrimitive.Content>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

/** The settings button at the foot of the sidebar. */
const ReaderSettings = () => {
  const { settings } = useReader();
  const mode = useReader(mangaMode);
  const detail: ReactNode = summary(settings, mode);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ReaderSettingsPopover
          side="left"
          trigger={
            <SidebarMenuButton
              size="lg"
              className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
                <MaterialSymbolsTuneRounded className="size-4.5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Налаштування</span>
                {detail && (
                  <span className="text-muted-foreground truncate text-xs">
                    {detail}
                  </span>
                )}
              </div>
            </SidebarMenuButton>
          }
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default ReaderSettings;
