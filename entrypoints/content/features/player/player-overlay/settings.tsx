import { type FC, type ReactNode, type RefObject, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import MaterialSymbolsArrowBackRounded from '~icons/material-symbols/arrow-back-rounded';
import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';
import MaterialSymbolsHighQualityOutlineRounded from '~icons/material-symbols/high-quality-outline-rounded';
import MaterialSymbolsSettingsOutlineRounded from '~icons/material-symbols/settings-outline-rounded';
import MaterialSymbolsSpeedOutlineRounded from '~icons/material-symbols/speed-outline-rounded';
import MaterialSymbolsSubtitlesOutlineRounded from '~icons/material-symbols/subtitles-outline-rounded';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import MenuPages from './menu-pages';
import ToolbarTooltip from './toolbar-tooltip';
import { useToolbarMenuPosition, useUiLock } from './use-ui-lock';

interface Submenu {
  id: 'quality' | 'subtitles' | 'speed';
  label: string;
  icon: ReactNode;
  value: string;
  options: Array<{ value: string; label: string }>;
  select: (value: string) => void;
}

const formatSpeed = (speed: number) => (speed === 1 ? 'Звичайна' : `${speed}x`);

const useSubmenus = (): Submenu[] => {
  const player = useIFramePlayer(
    useShallow((state) => ({
      qualities: state.qualities,
      currentQuality: state.currentQuality,
      setCurrentQuality: state.setCurrentQuality,
      subtitles: state.subtitles,
      currentSubtitle: state.currentSubtitle,
      setCurrentSubtitle: state.setCurrentSubtitle,
      speedOptions: state.speedOptions,
      currentSpeed: state.currentSpeed,
      changeSpeed: state.changeSpeed,
    })),
  );

  const submenus: Submenu[] = [];
  if (player.qualities.length > 0) {
    submenus.push({
      id: 'quality',
      label: 'Якість',
      icon: <MaterialSymbolsHighQualityOutlineRounded />,
      value: player.currentQuality,
      options: player.qualities
        .toReversed()
        .map((value) => ({ value, label: value })),
      select: player.setCurrentQuality,
    });
  }
  if (player.subtitles.length > 0) {
    submenus.push({
      id: 'subtitles',
      label: 'Субтитри',
      icon: <MaterialSymbolsSubtitlesOutlineRounded />,
      value: player.currentSubtitle,
      options: [
        { value: '', label: 'Вимк.' },
        ...player.subtitles.map((value) => ({ value, label: value })),
      ],
      select: player.setCurrentSubtitle,
    });
  }
  submenus.push({
    id: 'speed',
    label: 'Швидкість',
    icon: <MaterialSymbolsSpeedOutlineRounded />,
    value: String(player.currentSpeed),
    options: player.speedOptions.map((value) => ({
      value: String(value),
      label: formatSpeed(value),
    })),
    select: (value) => player.changeSpeed(Number(value)),
  });
  return submenus;
};

const selectedLabel = ({ options, value }: Submenu) =>
  options.find((option) => option.value === value)?.label ?? (value || 'Авто');

const SettingsPages = () => {
  const submenus = useSubmenus();
  const [activeId, setActiveId] = useState<Submenu['id']>();

  const active = submenus.find((submenu) => submenu.id === activeId);
  const goBack = () => setActiveId(undefined);

  return (
    <MenuPages page={active?.id ?? 'root'} direction={active ? 1 : -1}>
      {active ? (
        <>
          <DropdownMenuRadioGroup
            value={active.value}
            onValueChange={(value: string) => {
              active.select(value);
              goBack();
            }}
          >
            {active.options.map(({ value, label }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                closeOnClick={false}
                className="tabular-nums"
              >
                <span className="truncate">{label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-muted-foreground font-medium"
            closeOnClick={false}
            onClick={goBack}
          >
            <MaterialSymbolsArrowBackRounded />
            {active.label}
          </DropdownMenuItem>
        </>
      ) : (
        submenus.map((submenu) => (
          <DropdownMenuItem
            key={submenu.id}
            closeOnClick={false}
            onClick={() => setActiveId(submenu.id)}
          >
            {submenu.icon}
            {submenu.label}
            <span className="text-muted-foreground ml-auto flex min-w-0 items-center gap-0.5 text-xs tabular-nums">
              <span className="truncate">{selectedLabel(submenu)}</span>
              <MaterialSymbolsChevronRightRounded className="size-4" />
            </span>
          </DropdownMenuItem>
        ))
      )}
    </MenuPages>
  );
};

interface Props {
  /** Toolbar group the menu lines up with, rather than the button itself. */
  anchor: RefObject<HTMLElement | null>;
}

const Settings: FC<Props> = ({ anchor }) => {
  const position = useToolbarMenuPosition(anchor);
  const [open, setOpen] = useState(false);
  useUiLock(open);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <ToolbarTooltip label="Налаштування" disabled={open}>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MaterialSymbolsSettingsOutlineRounded
                className={cn(
                  'size-5 transition-transform duration-200',
                  open && 'rotate-45',
                )}
              />
            </Button>
          }
        />
      </ToolbarTooltip>
      <DropdownMenuContent
        className="bg-popover/60 w-56 backdrop-blur-xl"
        {...position}
      >
        <SettingsPages />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Settings;
