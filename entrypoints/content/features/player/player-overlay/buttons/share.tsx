import { type FC, type RefObject, useEffect, useState } from 'react';
import MaterialSymbolsCheckRounded from '~icons/material-symbols/check-rounded';
import MaterialSymbolsContentCopyOutlineRounded from '~icons/material-symbols/content-copy-outline-rounded';
import MaterialSymbolsShareOutlineRounded from '~icons/material-symbols/share-outline-rounded';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { usePlayer } from '../../context/player-context';
import { formatTime } from '../time-group';
import { useUiLock } from '../use-ui-lock';

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
  const { container, overlayRef, provider, team, currentEpisode } = usePlayer();
  const [open, setOpen] = useState(false);
  const [withTime, setWithTime] = useState(false);
  const [time, setTime] = useState(0);
  const [timeText, setTimeText] = useState('');
  const [copied, setCopied] = useState(false);
  useUiLock(open);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;

    const now = Math.floor(useIFramePlayer.getState().currentTime);
    setTime(now);
    setTimeText(formatTime(now));
    setWithTime(false);
    setCopied(false);
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

    void navigator.clipboard.writeText(url.href).then(() => setCopied(true));
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <MaterialSymbolsShareOutlineRounded />
                </Button>
              }
            />
          }
        />
        {!open && (
          <TooltipContent
            side="top"
            sideOffset={32}
            collisionBoundary={overlayRef.current as Element}
            collisionPadding={8}
            container={container}
          >
            Поділитися
          </TooltipContent>
        )}
      </Tooltip>
      <PopoverContent
        className="bg-popover/60 w-56 gap-0 p-1 backdrop-blur-xl"
        container={container}
        anchor={anchor}
        side="top"
        sideOffset={20}
        align="end"
        collisionBoundary={overlayRef.current as Element}
        collisionPadding={8}
      >
        <div className="text-muted-foreground truncate px-2 py-1.5 text-xs font-medium">
          Епізод {currentEpisode?.episode}
          {team?.title && ` · ${team.title}`}
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
        <div className="bg-border -mx-1 my-1 h-px" />
        <button
          type="button"
          onClick={copyLink}
          className="hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none [&_svg]:size-4 [&_svg]:shrink-0"
        >
          {copied ? (
            <MaterialSymbolsCheckRounded className="text-success" />
          ) : (
            <MaterialSymbolsContentCopyOutlineRounded />
          )}
          {copied ? 'Скопійовано' : 'Копіювати посилання'}
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default Share;
