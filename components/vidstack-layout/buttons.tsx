import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  CaptionButton,
  FullscreenButton,
  isTrackCaptionKind,
  MuteButton,
  PIPButton,
  PlayButton,
  useMediaState,
} from '@vidstack/react';
import {
  Minimize as FullscreenExitIcon,
  Maximize as FullscreenIcon,
  VolumeX as MuteIcon,
  PauseIcon,
  PictureInPictureIcon as PictureInPictureExitIcon,
  PictureInPicture2 as PictureInPictureIcon,
  PlayIcon,
  SubtitlesIcon,
  Volume2 as VolumeHighIcon,
  Volume1 as VolumeLowIcon,
} from 'lucide-react';
import MaterialSymbolsPauseOutlineRounded from '~icons/material-symbols/pause-outline-rounded';
import MaterialSymbolsPlayArrowOutlineRounded from '~icons/material-symbols/play-arrow-outline-rounded';
import MaterialSymbolsVolumeDownOutlineRounded from '~icons/material-symbols/volume-down-outline-rounded';
import MaterialSymbolsVolumeOffOutlineRounded from '~icons/material-symbols/volume-off-outline-rounded';
import MaterialSymbolsVolumeUpOutlineRounded from '~icons/material-symbols/volume-up-outline-rounded';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export interface MediaButtonProps {
  tooltipSide?: TooltipPrimitive.TooltipContentProps['side'];
  tooltipAlign?: TooltipPrimitive.TooltipContentProps['align'];
  tooltipOffset?: number;
}

export const buttonClass =
  'group ring-media-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-hidden ring-inset hover:bg-white/20 focus-visible:ring-4 aria-disabled:hidden';

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
          <Button variant="secondary" size="icon-sm">
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
          <Button variant="secondary" size="icon-sm">
            {isMuted || volume == 0 ? (
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
        <FullscreenButton className={buttonClass}>
          {isActive ? (
            <FullscreenExitIcon className="h-7 w-7" />
          ) : (
            <FullscreenIcon className="h-7 w-7" />
          )}
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
