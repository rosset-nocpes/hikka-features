/**
 * The controls the video player and the music player share. Each player
 * says where its tooltips go with a `MediaTooltipProvider`.
 */
import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import {
  createContext,
  type FC,
  type ReactElement,
  type ReactNode,
  use,
  useState,
} from 'react';
import MaterialSymbolsPauseOutlineRounded from '~icons/material-symbols/pause-outline-rounded';
import MaterialSymbolsPlayArrowOutlineRounded from '~icons/material-symbols/play-arrow-outline-rounded';
import MaterialSymbolsVolumeDownOutlineRounded from '~icons/material-symbols/volume-down-outline-rounded';
import MaterialSymbolsVolumeOffOutlineRounded from '~icons/material-symbols/volume-off-outline-rounded';
import MaterialSymbolsVolumeUpOutlineRounded from '~icons/material-symbols/volume-up-outline-rounded';

import SwapIcon from '@/components/swap-icon';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatTime } from '@/utils/time';

interface MediaTooltipOptions {
  /** Inside the player's shadow root, for its styles. */
  container?: HTMLElement | null;
  /** What the tooltips stay inside, besides the viewport. */
  collisionBoundary?: Element;
  /** How far above their buttons they show. */
  sideOffset: number;
  /** E.g. while the player hides its controls. */
  disabled?: boolean;
}

const MediaTooltipContext = createContext<MediaTooltipOptions>({
  sideOffset: 8,
});

/**
 * Where a player's tooltips go. Without one they'd render in the page's
 * body, outside the player's shadow root and its styles.
 */
export const MediaTooltipProvider = MediaTooltipContext;

interface MediaTooltipProps {
  label: string;
  /** The key that does the same, as `aria-keyshortcuts` names it. */
  shortcut?: string;
  disabled?: boolean;
  children: ReactElement;
}

/** A player control's name and shortcut, which never opens on focus alone. */
export const MediaTooltip: FC<MediaTooltipProps> = ({
  label,
  shortcut,
  disabled,
  children,
}) => {
  const options = use(MediaTooltipContext);
  return (
    <Tooltip
      disabled={disabled || options.disabled}
      onOpenChange={(open, details) => {
        if (open && details.reason === 'trigger-focus') details.cancel();
      }}
    >
      <TooltipTrigger
        aria-label={label}
        aria-keyshortcuts={shortcut}
        render={children}
      />
      <TooltipContent
        className="player-tooltip"
        side="top"
        sideOffset={options.sideOffset}
        collisionBoundary={options.collisionBoundary}
        collisionPadding={8}
        container={options.container}
      >
        {label}
        {shortcut && (
          <Kbd className="shrink-0 whitespace-nowrap">
            {shortcut.replace('+', ' + ')}
          </Kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

interface MediaButtonProps {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  /** A toggle's state, e.g. a panel it opens. */
  pressed?: boolean;
  children: ReactNode;
}

/** An icon button of a player's toolbar, named by its tooltip. */
export const MediaButton: FC<MediaButtonProps> = ({
  label,
  shortcut,
  onClick,
  disabled,
  pressed,
  children,
}) => (
  <MediaTooltip label={label} shortcut={shortcut}>
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      aria-pressed={pressed}
      className={cn(pressed && 'bg-muted text-foreground')}
      onClick={onClick}
    >
      {children}
    </Button>
  </MediaTooltip>
);

export const PlayPauseIcon: FC<{ playing: boolean }> = ({ playing }) => (
  <SwapIcon
    active={playing}
    on={<MaterialSymbolsPauseOutlineRounded className="size-5" />}
    off={<MaterialSymbolsPlayArrowOutlineRounded className="size-5" />}
  />
);

/** Only muting crossfades; the level icons swap as the slider moves. */
export const VolumeIcon: FC<{ silent: boolean; volume: number }> = ({
  silent,
  volume,
}) => (
  <SwapIcon
    active={silent}
    on={<MaterialSymbolsVolumeOffOutlineRounded className="size-5" />}
    off={
      volume < 0.5 ? (
        <MaterialSymbolsVolumeDownOutlineRounded className="size-5" />
      ) : (
        <MaterialSymbolsVolumeUpOutlineRounded className="size-5" />
      )
    }
  />
);

/** The time and length; a click shows what's left instead. */
export const TimeToggle: FC<{ currentTime: number; duration: number }> = ({
  currentTime,
  duration,
}) => {
  const [showRemaining, setShowRemaining] = useState(false);

  return (
    <MediaTooltip
      label={showRemaining ? 'Показати поточний час' : 'Показати залишок'}
    >
      <button
        type="button"
        onClick={() => setShowRemaining(!showRemaining)}
        className="focus-visible:ring-ring flex h-8 items-center gap-1 rounded-md px-1 text-sm font-medium whitespace-nowrap tabular-nums outline-none focus-visible:ring-1"
      >
        {showRemaining
          ? `−${formatTime(Math.max(0, duration - currentTime))}`
          : formatTime(currentTime)}
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{formatTime(duration)}</span>
      </button>
    </MediaTooltip>
  );
};

export const MediaDivider = () => (
  <div className="bg-border mx-0.5 h-5 w-px shrink-0" />
);

interface VolumeSliderProps {
  /** 0 to 1. */
  volume: number;
  onChange: (volume: number) => void;
}

export const VolumeSlider = ({ volume, onChange }: VolumeSliderProps) => (
  <SliderPrimitive.Root
    aria-label="Гучність"
    className="relative flex w-full touch-none items-center select-none"
    value={volume * 100}
    onValueChange={(value) => onChange((value as number) / 100)}
  >
    <SliderPrimitive.Control className="group relative flex h-8 w-full cursor-pointer touch-none items-center outline-hidden select-none data-disabled:opacity-50">
      <SliderPrimitive.Track className="bg-secondary relative h-1 w-full grow overflow-hidden rounded-full transition-transform duration-100 motion-safe:group-hover:scale-y-150">
        <SliderPrimitive.Indicator className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb />
    </SliderPrimitive.Control>
  </SliderPrimitive.Root>
);

interface VolumeSlideOutProps extends VolumeSliderProps {
  /** The mute button the slider slides out of. */
  children: ReactNode;
  /** The video toolbar's longer slider; the music player's is shorter. */
  wide?: boolean;
  /** Kept out without hover or focus, e.g. while the pointer is nearby. */
  open?: boolean;
  /** The mouse came over it. */
  onOpen?: () => void;
}

/** A mute button whose volume slider slides out on hover or focus. */
export const VolumeSlideOut = ({
  children,
  wide,
  open,
  onOpen,
  ...slider
}: VolumeSlideOutProps) => (
  <div
    data-slot="volume-slide-out"
    className="group/volume flex items-center"
    onPointerEnter={(event) => event.pointerType === 'mouse' && onOpen?.()}
  >
    {children}
    <div
      className={cn(
        'overflow-hidden transition-[width,opacity] duration-200 ease-out motion-reduce:transition-opacity',
        wide
          ? 'group-hover/volume:w-24 group-has-focus-visible/volume:w-24 has-data-dragging:w-24'
          : 'group-hover/volume:w-20 group-has-focus-visible/volume:w-20 has-data-dragging:w-20',
        'group-hover/volume:opacity-100 group-has-focus-visible/volume:opacity-100 has-data-dragging:opacity-100',
        open
          ? wide
            ? 'w-24 opacity-100'
            : 'w-20 opacity-100'
          : 'w-0 opacity-0',
      )}
    >
      <div className={cn('px-2', wide ? 'w-24' : 'w-20')}>
        <VolumeSlider {...slider} />
      </div>
    </div>
  </div>
);
