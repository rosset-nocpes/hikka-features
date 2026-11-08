import { type FC, type ReactNode, type RefObject, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import MaterialSymbolsArrowBackRounded from '~icons/material-symbols/arrow-back-rounded';
import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';
import MaterialSymbolsCloudOutlineRounded from '~icons/material-symbols/cloud-outline-rounded';
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

import { usePlayer } from '../context/player-context';
import { getEpisodeRanges } from '../teams';
import MenuPages from './menu-pages';
import ToolbarTooltip from './toolbar-tooltip';
import { useToolbarMenuPosition, useUiLock } from './use-ui-lock';

interface Submenu {
  id: 'source' | 'quality' | 'subtitles' | 'speed';
  label: string;
  icon: ReactNode;
  value: string;
  /** Shown on the root page, when the option's label says too little. */
  summary?: string;
  options: Array<{ value: string; label: string; detail?: string }>;
  select: (value: string) => void;
}

/**
 * Where the team's episodes play from: whichever provider has each one, or
 * the one the user picks, wherever it has it. Only offered when more than
 * one provider has the team, and lists only those.
 */
const useSourceSubmenu = (): Submenu | undefined => {
  const { team, provider, pinnedProvider, setPinnedProvider } = usePlayer(
    useShallow((state) => ({
      team: state.team,
      provider: state.provider,
      pinnedProvider: state.pinnedProvider,
      setPinnedProvider: state.setPinnedProvider,
    })),
  );
  if (!team || !provider) return undefined;

  const all = new Set(team.sources.map(({ episode }) => episode)).size;
  const options = [
    ...new Set(team.sources.map((source) => source.provider)),
  ].map((id) => {
    const episodes = team.sources.filter((source) => source.provider === id);
    // Ranges only where the provider lacks some of the team's episodes.
    const partial = new Set(episodes.map(({ episode }) => episode)).size < all;
    return {
      value: id,
      label: id.toUpperCase(),
      detail: partial ? getEpisodeRanges(episodes) : undefined,
    };
  });
  if (options.length < 2) return undefined;

  const pinned = options.some(({ value }) => value === pinnedProvider);
  return {
    id: 'source',
    label: 'Джерело',
    icon: <MaterialSymbolsCloudOutlineRounded />,
    value: pinned ? pinnedProvider! : '',
    summary: pinned
      ? provider.toUpperCase()
      : `Авто · ${provider.toUpperCase()}`,
    options: [{ value: '', label: 'Авто' }, ...options],
    select: (value) => setPinnedProvider(value || undefined),
  };
};

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

  const source = useSourceSubmenu();
  const submenus: Submenu[] = source ? [source] : [];
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

const selectedLabel = ({ options, value, summary }: Submenu) =>
  summary ??
  options.find((option) => option.value === value)?.label ??
  (value || 'Авто');

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
            {active.options.map(({ value, label, detail }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                closeOnClick={false}
                className="tabular-nums"
              >
                <span className="truncate">{label}</span>
                {detail && (
                  <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                    {detail}
                  </span>
                )}
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
                  open && 'motion-safe:rotate-45',
                )}
              />
            </Button>
          }
        />
      </ToolbarTooltip>
      <DropdownMenuContent
        className="player-glass player-menu w-56 rounded-lg border bg-(--player-glass) shadow-lg ring-0"
        {...position}
      >
        <SettingsPages />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Settings;
