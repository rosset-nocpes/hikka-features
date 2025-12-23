import { Copy, CopyCheck, Link } from 'lucide-react';
import { type FC, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import MaterialSymbolsShareOutline from '~icons/material-symbols/share-outline';
import { usePlayer } from '../context/player-context';

interface Props {
  time: number;
  isTimecodeLink: boolean;
  timecodeLink: number;
  setTimecodeLink: (value: number) => void;
  toggleTimestampLink: (value: boolean) => void;
}

const ShareLinkButton: FC<Props> = ({
  time,
  isTimecodeLink,
  timecodeLink,
  setTimecodeLink,
  toggleTimestampLink,
}) => {
  const { container, provider, team, currentEpisode } = usePlayer();

  const [showTooltip, setShowTooltip] = useState(false);
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const triggerRef = useRef(null);

  const handleCopyShareLink = () => {
    const query_params = new URLSearchParams();
    query_params.append('playerProvider', provider!);
    query_params.append('playerTeam', team!.title);
    query_params.append('playerEpisode', currentEpisode!.episode.toString());

    if (isTimecodeLink) {
      query_params.append('time', timecodeLink.toString());
    }

    navigator.clipboard.writeText(
      `${window.location.origin}${window.location.pathname}?${query_params.toString()}`,
    );
  };

  useEffect(() => {
    const handleClick = (event: PointerEvent) => {
      if (
        open &&
        contentRef.current &&
        triggerRef.current &&
        !event.composedPath().includes(contentRef.current) &&
        !event.composedPath().includes(triggerRef.current)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open]);

  return (
    <Popover
      modal={false}
      open={open}
      onOpenChange={(open) => {
        setOpen(open);

        if (open) {
          toggleTimestampLink(false);
          setTimecodeLink(Math.floor(time));
        }
      }}
    >
      <PopoverTrigger ref={triggerRef}>
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="sm">
              <MaterialSymbolsShareOutline className="flex-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Поділитися</TooltipContent>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent
        className="flex flex-col gap-2"
        container={container}
        ref={contentRef}
      >
        <div className="flex items-center gap-2 rounded-md bg-muted py-1 pr-1 pl-2">
          <Link className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="gradient-mask-r-90 cursor-default overflow-hidden text-nowrap font-medium text-xs">
            {window.location.href}
          </span>
          <TooltipProvider delay={0}>
            <Tooltip open={showTooltip}>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 rounded-sm hover:bg-background"
                    onClick={() => {
                      handleCopyShareLink();
                      setShowTooltip(true);
                      setTimeout(() => setShowTooltip(false), 1000);
                    }}
                  />
                }
              >
                <Copy className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="flex items-center gap-1 font-medium text-xs"
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
            <div className="text-muted-foreground text-xs">Починати з:</div>
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

export default ShareLinkButton;
