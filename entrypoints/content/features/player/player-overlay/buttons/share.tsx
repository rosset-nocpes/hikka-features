import { type FC, type RefObject, useState } from 'react';
import MaterialSymbolsCheckRounded from '~icons/material-symbols/check-rounded';
import MaterialSymbolsContentCopyOutlineRounded from '~icons/material-symbols/content-copy-outline-rounded';
import MaterialSymbolsShareOutlineRounded from '~icons/material-symbols/share-outline-rounded';

import SwapIcon from '@/components/swap-icon';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useCopy } from '@/hooks/use-copy';

import { usePlayer } from '../../context/player-context';
import { getTeamName } from '../../teams';
import { MenuItem, MenuSeparator } from '../../watch-together/menu';
import { formatTime } from '../time-group';
import ToolbarTooltip from '../toolbar-tooltip';
import { useToolbarMenuPosition, useUiLock } from '../use-ui-lock';

/** Reads "1:02:03", "2:03" or "123" as seconds. */
const parseTime = (value: string) => {
  const parts = value.trim().split(':');
  if (parts.length > 3 || !parts.every((part) => /^\d+$/.test(part))) return;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
};

interface Props {
  /** Toolbar group the menu lines up with, rather than the button itself. */
  anchor: RefObject<HTMLElement | null>;
}

const Share: FC<Props> = ({ anchor }) => {
  const { provider, team, currentEpisode } = usePlayer();
  const position = useToolbarMenuPosition(anchor);
  const [open, setOpen] = useState(false);
  const [withTime, setWithTime] = useState(false);
  const [time, setTime] = useState(0);
  const [timeText, setTimeText] = useState('');
  const { copied, copy, clear } = useCopy();
  useUiLock(open);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;

    const now = Math.floor(useIFramePlayer.getState().currentTime);
    setTime(now);
    setTimeText(formatTime(now));
    setWithTime(false);
    clear();
  };

  /** Applies the typed time, or restores the last valid one. */
  const commitTime = () => {
    const { duration } = useIFramePlayer.getState();
    const parsed = parseTime(timeText) ?? time;
    const next = duration > 0 ? Math.min(parsed, Math.floor(duration)) : parsed;
    setTime(next);
    setTimeText(formatTime(next));
    return next;
  };

  const copyLink = () => {
    if (!provider || !currentEpisode) return;

    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set('playerProvider', provider);
    url.searchParams.set('playerTeam', team?.title ?? '');
    url.searchParams.set('playerEpisode', String(currentEpisode.episode));
    if (withTime) url.searchParams.set('time', String(commitTime()));

    void copy(url.href);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <ToolbarTooltip label="Поділитися" disabled={open}>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MaterialSymbolsShareOutlineRounded />
            </Button>
          }
        />
      </ToolbarTooltip>
      <PopoverContent
        className="ring-border w-56 gap-0 rounded-lg p-1"
        {...position}
      >
        <div className="text-muted-foreground truncate px-2 py-1.5 text-xs font-medium">
          Епізод {currentEpisode?.episode}
          {team?.title && ` · ${getTeamName(team)}`}
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <label className="flex flex-1 cursor-pointer items-center gap-2 select-none">
            <Switch
              size="sm"
              checked={withTime}
              onCheckedChange={setWithTime}
            />
            Почати з
          </label>
          <input
            aria-label="Час початку"
            inputMode="numeric"
            value={timeText}
            onChange={(event) => {
              setTimeText(event.target.value);
              setWithTime(true);
            }}
            onBlur={commitTime}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            className={cn(
              'bg-foreground/5 focus-visible:ring-ring h-6 w-18 rounded-sm px-1.5 text-right text-sm tabular-nums outline-none focus-visible:ring-1',
              !withTime && 'text-muted-foreground',
            )}
          />
        </div>
        <MenuSeparator />
        <MenuItem onClick={copyLink}>
          <SwapIcon
            active={!!copied}
            on={<MaterialSymbolsCheckRounded className="text-success" />}
            off={<MaterialSymbolsContentCopyOutlineRounded />}
          />
          {copied ? 'Скопійовано' : 'Копіювати посилання'}
        </MenuItem>
      </PopoverContent>
    </Popover>
  );
};

export default Share;
