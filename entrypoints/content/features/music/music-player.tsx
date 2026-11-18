import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsDragIndicator from '~icons/material-symbols/drag-indicator';
import MaterialSymbolsLibraryMusicRounded from '~icons/material-symbols/library-music-rounded';
import MaterialSymbolsPauseOutlineRounded from '~icons/material-symbols/pause-outline-rounded';
import MaterialSymbolsPlayArrowOutlineRounded from '~icons/material-symbols/play-arrow-outline-rounded';
import MaterialSymbolsQueueMusicRounded from '~icons/material-symbols/queue-music-rounded';
import MaterialSymbolsSkipNextOutlineRounded from '~icons/material-symbols/skip-next-outline-rounded';
import MaterialSymbolsSkipPreviousOutlineRounded from '~icons/material-symbols/skip-previous-outline-rounded';
import MaterialSymbolsVolumeDownOutlineRounded from '~icons/material-symbols/volume-down-outline-rounded';
import MaterialSymbolsVolumeOffOutlineRounded from '~icons/material-symbols/volume-off-outline-rounded';
import MaterialSymbolsVolumeUpOutlineRounded from '~icons/material-symbols/volume-up-outline-rounded';

import SwapIcon from '@/components/swap-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FLOATING_DURATION_MS,
  FLOATING_EASE,
  reducedMotion,
  useFloatingCard,
} from '@/hooks/use-floating-card';
import { useIFramePlayer } from '@/hooks/use-iframe-player';
import { onHikkaLinkClick } from '@/utils/hikka-router';

import type { MusicTrack } from './animethemes';

import { ModalUi } from '../../core/base-feature';
import { SeekBar } from '../player/player-overlay/sliders/time';
import { VolumeSlider } from '../player/player-overlay/sliders/volume';
import { formatTime } from '../player/player-overlay/time-group';
import Equalizer from './equalizer';
import { currentTrack, musicCorner, trackLabel, useMusic } from './use-music';

/** Where the tooltips go: inside the player's shadow root, for its styles. */
let tooltipContainer: HTMLElement | undefined;

const musicUi = new ModalUi({
  name: 'music-player',
  // Under the video player, whose backdrop covers it while it's full size.
  zIndex: 99,
  onMount(container) {
    tooltipContainer = container;
    // Only the bar takes the pointer; the page stays usable around it.
    container.classList.add(
      'pointer-events-none',
      '[-webkit-tap-highlight-color:transparent]',
    );
  },
  render: () => (
    // Under reduced motion, Motion keeps only the fades.
    <MotionConfig reducedMotion="user">
      <MusicCard />
    </MotionConfig>
  ),
  onRemove: () => useMusic.getState().stop(),
});

/** Plays `queue` from `index` in the floating music player, opening it. */
export const playMusic = (queue: MusicTrack[], index: number) => {
  useMusic.getState().playQueue(queue, index);
  if (!musicUi.isOpen) musicUi.open();
};

const closeMusic = () => musicUi.close();

// The video and the music never play over each other: whichever starts
// pauses the other.
useIFramePlayer.subscribe((state, previous) => {
  if (state.isPlaying && !previous.isPlaying) useMusic.getState().pause();
});
useMusic.subscribe((state, previous) => {
  if (state.playing && !previous.playing) {
    const video = useIFramePlayer.getState();
    if (video.isPlaying) video.pause();
  }
});

const Divider = () => <div className="bg-border mx-0.5 h-5 w-px shrink-0" />;

/** A tooltip like the video toolbar's. */
const MusicTooltip = ({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) => (
  <Tooltip
    onOpenChange={(open, details) => {
      if (open && details.reason === 'trigger-focus') details.cancel();
    }}
  >
    <TooltipTrigger aria-label={label} render={children} />
    <TooltipContent
      className="player-tooltip"
      side="top"
      sideOffset={8}
      collisionPadding={8}
      container={tooltipContainer}
    >
      {label}
    </TooltipContent>
  </Tooltip>
);

/** An icon button of the toolbar, named by its tooltip. */
const ToolbarButton = ({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: ReactNode;
}) => (
  <MusicTooltip label={label}>
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
  </MusicTooltip>
);

const MusicCard = () => {
  const track = useMusic(currentTrack);
  const {
    queue,
    index,
    playing,
    loading,
    failed,
    currentTime,
    duration,
    bufferedTime,
    toggle,
    seek,
    next,
    previous,
  } = useMusic();
  const { disableBlur } = useSettings().features.player;
  const [showQueue, setShowQueue] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  // Stacks above the video's mini player when they share a corner.
  const startDrag = useFloatingCard(cardRef, {
    floating: true,
    corner: musicCorner,
    order: 1,
  });

  // Slides in where it lands, like the video's bar.
  useEffect(() => {
    cardRef.current?.animate(
      reducedMotion()
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1 }],
      { duration: FLOATING_DURATION_MS, easing: FLOATING_EASE },
    );
  }, []);

  const href = track && `/anime/${track.slug}`;
  const hasQueue = queue.length > 1;

  return (
    <section
      ref={cardRef}
      aria-label="Музика"
      className={cn(
        // The video's floating card: its glass, corners and shadow.
        'player-glass text-foreground pointer-events-auto fixed top-0 left-0 z-30 flex w-[min(calc(100vw-1rem),400px)] flex-col overflow-hidden rounded-[min(calc(var(--radius-md)+9px),var(--radius)*100)] border shadow-2xl data-dragging:cursor-grabbing data-dragging:select-none',
        // Without the blur, solid, as the player's menus turn.
        disableBlur && 'bg-background! backdrop-filter-none',
      )}
    >
      <div className="flex w-full items-center gap-2 p-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Перемістити"
          className="text-muted-foreground shrink-0 cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={startDrag}
        >
          <MaterialSymbolsDragIndicator className="size-5" />
        </Button>
        <a
          href={href}
          onClick={onHikkaLinkClick}
          tabIndex={-1}
          aria-hidden
          draggable={false}
          className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md"
        >
          {track?.poster ? (
            <img
              src={track.poster}
              alt=""
              className="size-full object-cover"
              draggable={false}
            />
          ) : (
            <MaterialSymbolsLibraryMusicRounded className="text-muted-foreground size-5" />
          )}
        </a>
        <div className="grid min-w-0 flex-1 leading-tight">
          <a
            href={href}
            onClick={onHikkaLinkClick}
            title={track?.animeTitle}
            draggable={false}
            className="truncate text-sm font-medium hover:underline"
          >
            {track?.title}
          </a>
          <span
            className={cn(
              'text-muted-foreground truncate text-xs',
              failed && 'text-destructive',
            )}
          >
            {failed
              ? 'Не вдалося завантажити'
              : track &&
                [trackLabel(track), track.author].filter(Boolean).join(' · ')}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Закрити"
          className="shrink-0"
          onClick={closeMusic}
        >
          <MaterialSymbolsCloseRounded />
        </Button>
      </div>

      <div className="px-2">
        <SeekBar
          currentTime={currentTime}
          duration={duration}
          bufferedTime={bufferedTime}
          seek={seek}
          compact
          trackClassName="pt-0 pb-1"
        />
      </div>

      <div className="flex items-center justify-between gap-2 p-2 pt-1">
        <div className="flex min-w-0 items-center gap-1">
          {hasQueue && (
            <ToolbarButton label="Попередній" onClick={previous}>
              <MaterialSymbolsSkipPreviousOutlineRounded className="size-5" />
            </ToolbarButton>
          )}
          <ToolbarButton
            label={playing ? 'Призупинити' : 'Відтворити'}
            onClick={toggle}
          >
            {loading ? (
              <Spinner className="size-5" aria-label="Завантаження" />
            ) : (
              <SwapIcon
                active={playing}
                on={<MaterialSymbolsPauseOutlineRounded className="size-5" />}
                off={
                  <MaterialSymbolsPlayArrowOutlineRounded className="size-5" />
                }
              />
            )}
          </ToolbarButton>
          {hasQueue && (
            <ToolbarButton
              label="Наступний"
              disabled={index >= queue.length - 1}
              onClick={next}
            >
              <MaterialSymbolsSkipNextOutlineRounded className="size-5" />
            </ToolbarButton>
          )}
          <VolumeControl />
          <Divider />
          <TimeGroup />
        </div>
        {hasQueue && (
          <div className="shrink-0">
            <ToolbarButton
              label={showQueue ? 'Сховати треки' : 'Треки'}
              pressed={showQueue}
              onClick={() => setShowQueue((shown) => !shown)}
            >
              <MaterialSymbolsQueueMusicRounded className="size-5" />
            </ToolbarButton>
          </div>
        )}
      </div>

      {/* Unfolds from under the toolbar; a card in a bottom corner grows
          upwards with it (see useFloatingCard). */}
      <AnimatePresence initial={false}>
        {showQueue && hasQueue && (
          <motion.div
            key="tracks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <TrackList />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

/** Mute, with the level sliding out on hover or focus, as in the video toolbar. */
const VolumeControl = () => {
  const { volume, muted, setVolume, toggleMute } = useMusic();
  const silent = muted || volume === 0;

  return (
    <div className="group/volume flex items-center">
      <ToolbarButton
        label={silent ? 'Увімкнути звук' : 'Вимкнути звук'}
        onClick={toggleMute}
      >
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
      </ToolbarButton>
      <div className="w-0 overflow-hidden opacity-0 transition-[width,opacity] duration-200 ease-out group-hover/volume:w-20 group-hover/volume:opacity-100 group-has-focus-visible/volume:w-20 group-has-focus-visible/volume:opacity-100 has-data-dragging:w-20 has-data-dragging:opacity-100 motion-reduce:transition-opacity">
        <div className="w-20 px-2">
          <VolumeSlider volume={silent ? 0 : volume} onChange={setVolume} />
        </div>
      </div>
    </div>
  );
};

/** The time and length; a click shows what's left instead, as in the video toolbar. */
const TimeGroup = () => {
  const { currentTime, duration } = useMusic();
  const [showRemaining, setShowRemaining] = useState(false);

  return (
    <MusicTooltip
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
    </MusicTooltip>
  );
};

/** The anime's openings and endings, laid out like the player's episodes. */
const TrackList = () => {
  const { queue, index, playing, playQueue, toggle } = useMusic();

  return (
    <ScrollArea
      scrollFade
      className="border-border max-h-56 border-t [&>[data-slot=scroll-area-viewport]]:overscroll-contain"
    >
      <ScrollAreaPrimitive.Content
        // Not the default fit-content, which would stop titles truncating.
        style={{ minWidth: 0 }}
      >
        <ol className="p-2">
          {queue.map((item, position) => {
            const current = position === index;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  aria-current={current}
                  data-active={current}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-hidden focus-visible:ring-2 data-[active=true]:font-medium"
                  onClick={() =>
                    current ? toggle() : playQueue(queue, position)
                  }
                >
                  <span className="text-muted-foreground flex w-4 shrink-0 justify-center text-xs tabular-nums">
                    {current ? (
                      <Equalizer playing={playing} className="text-primary" />
                    ) : (
                      position + 1
                    )}
                  </span>
                  <span className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate">{item.title}</span>
                    {item.author && (
                      <span className="text-muted-foreground truncate text-xs font-normal">
                        {item.author}
                      </span>
                    )}
                  </span>
                  <Badge className="bg-muted text-muted-foreground h-4 shrink-0 rounded-sm px-1.5 text-[10px] font-semibold">
                    {trackLabel(item)}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ol>
      </ScrollAreaPrimitive.Content>
    </ScrollArea>
  );
};
