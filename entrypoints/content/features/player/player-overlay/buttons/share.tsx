import { Link, Copy, CopyCheck } from 'lucide-react';
import { useState } from 'react';
import MaterialSymbolsShareOutline from '~icons/material-symbols/share-outline';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  PopoverTrigger,
  PopoverContent,
  Popover,
} from '@/components/ui/popover';
import {
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Tooltip,
} from '@/components/ui/tooltip';

import { usePlayer } from '../../context/player-context';

const Share = () => {
  const { container, provider, team, currentEpisode } = usePlayer();
  // const { currentTime } = useMediaStore();
  // const player = useMediaPlayer();

  const [showTooltip, setShowTooltip] = useState(false);
  const [isTimecodeLink, toggleTimestampLink] = useState(false);
  const [timecodeLink, setTimecodeLink] = useState(0);

  const handleCopyShareLink = () => {
    if (!provider || !team || !currentEpisode) return;

    const url = new URL(`${window.location.origin}${window.location.pathname}`);
    const searchParams = url.searchParams;

    searchParams.append('playerProvider', provider);
    searchParams.append('playerTeam', team.title);
    searchParams.append('playerEpisode', currentEpisode.episode.toString());

    if (isTimecodeLink) {
      searchParams.append('time', timecodeLink.toString());
    }

    navigator.clipboard.writeText(url.href);
  };

  return (
    <Popover
    // onOpenChange={(open) => {
    //   if (open) {
    //     toggleTimestampLink(false);
    //     setTimecodeLink(Math.floor(currentTime));
    //   }
    // }}
    >
      <PopoverTrigger>
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="sm">
              <MaterialSymbolsShareOutline className="flex-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            // className={tooltipClass}
            side="top"
            sideOffset={32}
            // collisionBoundary={player?.el}
            collisionPadding={8}
          >
            Поділитися
          </TooltipContent>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent
        className="flex flex-col gap-2"
        container={container}
        side="top"
        sideOffset={32}
        collisionPadding={8}
      >
        <div className="flex items-center gap-2 rounded-md bg-muted py-1 pl-2 pr-1">
          <Link className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="cursor-default overflow-hidden text-nowrap text-xs font-medium gradient-mask-r-90">
            {window.location.href}
          </span>
          <TooltipProvider>
            <Tooltip delayDuration={0} open={showTooltip}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 rounded-sm hover:bg-background"
                  onClick={() => {
                    handleCopyShareLink();
                    setShowTooltip(true);
                    setTimeout(() => setShowTooltip(false), 1000);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="flex items-center gap-1 text-xs font-medium"
              >
                <CopyCheck className="size-3.5 shrink-0" />
                Скопійовано
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isTimecodeLink}
            onCheckedChange={() => toggleTimestampLink(!isTimecodeLink)}
          />
          <div
            className={cn(
              'flex items-center gap-2',
              !isTimecodeLink && 'cursor-not-allowed opacity-70',
            )}
          >
            <div className="text-xs text-muted-foreground">Починати з:</div>
            <Input
              disabled={!isTimecodeLink}
              defaultValue={new Date(timecodeLink * 1000)
                .toISOString()
                .slice(11, 19)}
              onBlur={(e) => {
                const [hours, minutes, seconds] = e.target.value
                  .split(':')
                  .map(Number);
                setTimecodeLink(hours * 3600 + minutes * 60 + seconds);
              }}
              placeholder="00:00:00"
              className="h-6 w-24 text-xs focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Share;
