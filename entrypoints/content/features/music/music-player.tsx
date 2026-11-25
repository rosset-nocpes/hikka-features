import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsDragIndicator from '~icons/material-symbols/drag-indicator';
import MaterialSymbolsLibraryMusicRounded from '~icons/material-symbols/library-music-rounded';
import MaterialSymbolsQueueMusicRounded from '~icons/material-symbols/queue-music-rounded';
import MaterialSymbolsRepeatOneRounded from '~icons/material-symbols/repeat-one-rounded';
import MaterialSymbolsRepeatRounded from '~icons/material-symbols/repeat-rounded';
import MaterialSymbolsShuffleRounded from '~icons/material-symbols/shuffle-rounded';
import MaterialSymbolsSkipNextOutlineRounded from '~icons/material-symbols/skip-next-outline-rounded';
import MaterialSymbolsSkipPreviousOutlineRounded from '~icons/material-symbols/skip-previous-outline-rounded';

import {
  MediaButton,
  MediaDivider,
  MediaTooltipProvider,
  PlayPauseIcon,
  TimeToggle,
  VolumeIcon,
  VolumeSlideOut,
} from '@/components/media/controls';
import { SeekBar } from '@/components/media/seek-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
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
import Equalizer from './equalizer';
import LikeButton from './like-button';
import SongLink from './song-link';
import {
  currentTrack,
  musicCorner,
  type RepeatMode,
  setMediaArtwork,
  trackLabel,
  useMusic,
} from './use-music';
import { artOf, useTrackRelease } from './use-song-releases';

const musicUi = new ModalUi({
  name: 'music-player',
  // Under the video player, whose backdrop covers it while it's full size.
  zIndex: 99,
  onMount(container) {
    // Only the bar takes the pointer; the page stays usable around it.
    container.classList.add(
      'pointer-events-none',
      '[-webkit-tap-highlight-color:transparent]',
    );
  },
  render: (container) => (
    // Under reduced motion, Motion keeps only the fades.
    <MotionConfig reducedMotion="user">
      {/* Tooltips go inside the player's shadow root, for its styles. */}
      <MediaTooltipProvider value={{ container, sideOffset: 8 }}>
        <MusicCard />
      </MediaTooltipProvider>
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
    repeat,
    toggle,
    seek,
    next,
    previous,
  } = useMusic();
  const { disableBlur } = useSettings().features.player;
  const [showQueue, setShowQueue] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const release = useTrackRelease(track);
  const art = artOf(track, release);

  // The OS's controls show the cover too, once it's known.
  useEffect(() => setMediaArtwork(art), [art, track?.key]);

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
          {art ? (
            <img
              src={art}
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
        <SongLink release={release} tooltip />
        {track && <LikeButton track={track} tooltip />}
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
            <MediaButton label="Попередній" onClick={previous}>
              <MaterialSymbolsSkipPreviousOutlineRounded className="size-5" />
            </MediaButton>
          )}
          <MediaButton
            label={playing ? 'Призупинити' : 'Відтворити'}
            onClick={toggle}
          >
            {loading ? (
              <Spinner className="size-5" aria-label="Завантаження" />
            ) : (
              <PlayPauseIcon playing={playing} />
            )}
          </MediaButton>
          {hasQueue && (
            <MediaButton
              label="Наступний"
              disabled={index >= queue.length - 1 && repeat === 'off'}
              onClick={next}
            >
              <MaterialSymbolsSkipNextOutlineRounded className="size-5" />
            </MediaButton>
          )}
          <VolumeControl />
          <MediaDivider />
          <TimeToggle currentTime={currentTime} duration={duration} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasQueue && <ShuffleButton />}
          <RepeatButton />
          {hasQueue && (
            <MediaButton
              label={showQueue ? 'Сховати треки' : 'Треки'}
              pressed={showQueue}
              onClick={() => setShowQueue((shown) => !shown)}
            >
              <MaterialSymbolsQueueMusicRounded className="size-5" />
            </MediaButton>
          )}
        </div>
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

/** What a click on the repeat button turns it to. */
const REPEAT_LABELS: Record<RepeatMode, string> = {
  off: 'Повторювати всі',
  all: 'Повторювати трек',
  one: 'Не повторювати',
};

/** A mode that's on: lit in the accent, with a dot under it. */
const ModeIcon = ({ on, children }: { on: boolean; children: ReactNode }) => (
  <span
    className={cn(
      'relative flex transition-colors',
      on &&
        'text-primary after:bg-primary after:absolute after:-bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full',
    )}
  >
    {children}
  </span>
);

const RepeatButton = () => {
  const { repeat, cycleRepeat } = useMusic();
  return (
    <MediaButton label={REPEAT_LABELS[repeat]} onClick={cycleRepeat}>
      <ModeIcon on={repeat !== 'off'}>
        {repeat === 'one' ? (
          <MaterialSymbolsRepeatOneRounded className="size-5" />
        ) : (
          <MaterialSymbolsRepeatRounded className="size-5" />
        )}
      </ModeIcon>
    </MediaButton>
  );
};

const ShuffleButton = () => {
  const { shuffle, toggleShuffle } = useMusic();
  return (
    <MediaButton
      label={shuffle ? 'Не перемішувати' : 'Перемішати'}
      onClick={toggleShuffle}
    >
      <ModeIcon on={shuffle}>
        <MaterialSymbolsShuffleRounded className="size-5" />
      </ModeIcon>
    </MediaButton>
  );
};

/** Mute, with the level sliding out on hover or focus. */
const VolumeControl = () => {
  const { volume, muted, setVolume, toggleMute } = useMusic();
  const silent = muted || volume === 0;

  return (
    <VolumeSlideOut volume={silent ? 0 : volume} onChange={setVolume}>
      <MediaButton
        label={silent ? 'Увімкнути звук' : 'Вимкнути звук'}
        onClick={toggleMute}
      >
        <VolumeIcon silent={silent} volume={volume} />
      </MediaButton>
    </VolumeSlideOut>
  );
};

/** The anime's openings and endings, laid out like the player's episodes. */
const TrackList = () => {
  const { queue, index, playing, playAt, toggle } = useMusic();
  // Favourites from a profile come from many anime: each row says which.
  const mixed = new Set(queue.map((item) => item.slug)).size > 1;

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
              <li
                key={item.key}
                data-active={current}
                className="group/track hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground flex items-center rounded-md pr-1"
              >
                <button
                  type="button"
                  aria-current={current}
                  className="focus-visible:ring-sidebar-ring flex min-w-0 flex-1 items-center gap-2 rounded-md p-2 text-left text-sm outline-hidden group-data-[active=true]/track:font-medium focus-visible:ring-2"
                  onClick={() => (current ? toggle() : playAt(position))}
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
                    {(item.author || mixed) && (
                      <span className="text-muted-foreground truncate text-xs font-normal">
                        {[mixed && item.animeTitle, item.author]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </span>
                  <Badge className="bg-muted text-muted-foreground h-4 shrink-0 rounded-sm px-1.5 text-[10px] font-semibold">
                    {trackLabel(item)}
                  </Badge>
                </button>
                <LikeButton track={item} className="size-7" />
              </li>
            );
          })}
        </ol>
      </ScrollAreaPrimitive.Content>
    </ScrollArea>
  );
};
