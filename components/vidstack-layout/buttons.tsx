import type * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  CaptionButton,
  FullscreenButton,
  isTrackCaptionKind,
  MuteButton,
  PIPButton,
  PlayButton,
  useMediaState,
  useMediaStore,
} from '@vidstack/react';
import {
  Copy,
  CopyCheck,
  Link,
  PictureInPictureIcon as PictureInPictureExitIcon,
  PictureInPicture2 as PictureInPictureIcon,
  SubtitlesIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePlayer } from '@/entrypoints/content/modules/player/context/player-context';
import MaterialSymbolsFullscreenExitRounded from '~icons/material-symbols/fullscreen-exit-rounded';
import MaterialSymbolsFullscreenRounded from '~icons/material-symbols/fullscreen-rounded';
import MaterialSymbolsPauseOutlineRounded from '~icons/material-symbols/pause-outline-rounded';
import MaterialSymbolsPlayArrowOutlineRounded from '~icons/material-symbols/play-arrow-outline-rounded';
import MaterialSymbolsShareOutline from '~icons/material-symbols/share-outline';
import MaterialSymbolsVolumeDownOutlineRounded from '~icons/material-symbols/volume-down-outline-rounded';
import MaterialSymbolsVolumeOffOutlineRounded from '~icons/material-symbols/volume-off-outline-rounded';
import MaterialSymbolsVolumeUpOutlineRounded from '~icons/material-symbols/volume-up-outline-rounded';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

export interface MediaButtonProps {
  tooltipSide?: TooltipPrimitive.TooltipContentProps['side'];
  tooltipAlign?: TooltipPrimitive.TooltipContentProps['align'];
  tooltipOffset?: number;
}

export const buttonClass =
  'group ring-media-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-4 aria-disabled:hidden';

export const tooltipClass =
  'animate-out fade-out slide-out-to-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:slide-in-from-bottom-4 z-10 rounded-sm bg-black/90 px-2 py-0.5 text-sm font-medium text-white parent-data-[open]:hidden';

export function Play({
  tooltipOffset = 0,
  tooltipSide = 'top',
  tooltipAlign = 'center',
}: MediaButtonProps) {
  const isPaused = useMediaState('paused');
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <PlayButton asChild>
          <Button variant="ghost" size="icon-sm">
            {isPaused ? (
              <MaterialSymbolsPlayArrowOutlineRounded className="text-lg" />
            ) : (
              <MaterialSymbolsPauseOutlineRounded className="text-lg" />
            )}
          </Button>
        </PlayButton>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isPaused ? 'Play' : 'Pause'}
      </TooltipContent>
    </Tooltip>
  );
}

export function Mute({
  tooltipOffset = 0,
  tooltipSide = 'top',
  tooltipAlign = 'center',
}: MediaButtonProps) {
  const volume = useMediaState('volume'),
    isMuted = useMediaState('muted');
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <MuteButton asChild>
          <Button variant="ghost" size="icon-sm">
            {isMuted || volume === 0 ? (
              <MaterialSymbolsVolumeOffOutlineRounded className="text-lg" />
            ) : volume < 0.5 ? (
              <MaterialSymbolsVolumeDownOutlineRounded className="text-lg" />
            ) : (
              <MaterialSymbolsVolumeUpOutlineRounded className="text-lg" />
            )}
          </Button>
        </MuteButton>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isMuted ? 'Unmute' : 'Mute'}
      </TooltipContent>
    </Tooltip>
  );
}

export function Caption({
  tooltipOffset = 0,
  tooltipSide = 'top',
  tooltipAlign = 'center',
}: MediaButtonProps) {
  const track = useMediaState('textTrack'),
    isOn = track && isTrackCaptionKind(track);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <CaptionButton className={buttonClass}>
          <SubtitlesIcon
            className={`h-7 w-7 ${!isOn ? 'text-white/60' : ''}`}
          />
        </CaptionButton>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isOn ? 'Closed-Captions Off' : 'Closed-Captions On'}
      </TooltipContent>
    </Tooltip>
  );
}

export function PIP({
  tooltipOffset = 0,
  tooltipSide = 'top',
  tooltipAlign = 'center',
}: MediaButtonProps) {
  const isActive = useMediaState('pictureInPicture');
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <PIPButton className={buttonClass}>
          {isActive ? (
            <PictureInPictureExitIcon className="h-7 w-7" />
          ) : (
            <PictureInPictureIcon className="h-7 w-7" />
          )}
        </PIPButton>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isActive ? 'Exit PIP' : 'Enter PIP'}
      </TooltipContent>
    </Tooltip>
  );
}

export function Fullscreen({
  tooltipOffset = 0,
  tooltipSide = 'top',
  tooltipAlign = 'center',
}: MediaButtonProps) {
  const isActive = useMediaState('fullscreen');
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <FullscreenButton asChild>
          <Button variant="ghost" size="icon-sm">
            {isActive ? (
              <MaterialSymbolsFullscreenExitRounded />
            ) : (
              <MaterialSymbolsFullscreenRounded />
            )}
          </Button>
        </FullscreenButton>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isActive ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      </TooltipContent>
    </Tooltip>
  );
}

// interface Props {
//   time: number;
// }

export const PlayerShareLinkButton = () => {
  const { container, provider, team, currentEpisode } = usePlayer();
  const { currentTime } = useMediaStore();

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
      onOpenChange={(open) => {
        if (open) {
          toggleTimestampLink(false);
          setTimecodeLink(Math.floor(currentTime));
        }
      }}
    >
      <PopoverTrigger>
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="sm">
              <MaterialSymbolsShareOutline className="flex-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Поділитися</TooltipContent>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2" container={container}>
        <div className="flex items-center gap-2 rounded-md bg-muted py-1 pr-1 pl-2">
          <Link className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="gradient-mask-r-90 cursor-default overflow-hidden text-nowrap font-medium text-xs">
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
