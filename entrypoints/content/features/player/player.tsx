import { useLayoutEffect, useRef } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { createFeatureUi } from '../../core/base-feature';
import { startActivityReporter } from './activity-reporter';
import { usePlayer } from './context/player-context';
import {
  type PlayerLayout,
  useLayoutTransition,
  useMiniPlayerDrag,
} from './mini-player-layout';
import PlayerMobileToolbar from './mobile-toolbar/player-mobile-toolbar';
import PlayerIFrameEffects from './player-iframe-effects';
import PlayerMiniBar from './player-mini-bar';
import PlayerNavbar from './player-navbar';
import PlayerOverlay from './player-overlay/player-overlay';
import { useWatchTogether } from './watch-together/use-watch-together';
import WatchTogetherInvite from './watch-together/watch-together-invite';

const MOUNT_TAG = 'player-ui';

let playerUiPromise: ReturnType<typeof createFeatureUi> | undefined;
let stopActivityReporter: (() => void) | undefined;

function player() {
  playerUiPromise ??= createFeatureUi({
    name: MOUNT_TAG,
    position: 'modal',
    zIndex: 100,
    themeVariables: false,
    onMount(container, wrapper) {
      usePlayer.getState().setContainer(container);
      wrapper.className = 'size-full';
      container.classList.add('h-full');
      stopActivityReporter = startActivityReporter();
    },
    render: () => (
      <SidebarProvider className="h-full w-full">
        <PlayerFrame />
      </SidebarProvider>
    ),
    onRemove: () => {
      useWatchTogether.getState().leave();
      stopActivityReporter?.();
      stopActivityReporter = undefined;

      const { fullscreen, toggleFullscreen, setVideoPiPActive } =
        usePlayer.getState();
      if (fullscreen) toggleFullscreen();
      setVideoPiPActive(false);
      document.body.classList.remove('h-full', 'overflow-hidden');

      useIFramePlayer.getState().reset();
      playerUiPromise = undefined;
    },
  });

  return playerUiPromise;
}

export const isPlayerMounted = () =>
  !!document.getElementsByTagName(MOUNT_TAG)[0];

/** Shows `data` in the player, opening it or bringing it out of mini mode. */
export const openPlayer = (data: API.WatchData) => {
  const { initialize, setMiniPlayer, setVideoPiPActive } = usePlayer.getState();
  initialize(data);
  if (isPlayerMounted()) {
    setMiniPlayer(false);
    setVideoPiPActive(false);
  } else {
    void player().then((ui) => ui.mount());
  }
};

export const removePlayer = () => {
  playerUiPromise?.then((ui) => {
    if (ui.mounted || document.getElementsByTagName(MOUNT_TAG)[0]) {
      ui.remove();
    }
  });
};

const PlayerFrame = () => {
  const { miniPlayer, videoPiPActive, fullscreen, container } = usePlayer();
  const { disableBlur } = useSettings().features.player;
  const { setOpen } = useSidebar();

  const isCompactMode = miniPlayer || videoPiPActive;

  // A layout effect: the page must settle before the player measures its
  // new size for the mini player transition.
  useLayoutEffect(() => {
    container?.parentElement?.classList.toggle(
      'pointer-events-none',
      isCompactMode,
    );
    document.body.classList.toggle('h-full', !isCompactMode);
    document.body.classList.toggle('overflow-hidden', !isCompactMode);
  }, [isCompactMode, container]);

  // The sidebar gives way to the video in fullscreen and the compact modes.
  useLayoutEffect(() => {
    setOpen(!isCompactMode && !fullscreen);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompactMode, fullscreen]);

  return (
    <div
      id="player-frame"
      className={cn(
        'relative flex size-full items-center justify-center md:p-8',
        disableBlur && '**:[[class*=backdrop-blur]]:backdrop-blur-none',
        isCompactMode && 'pointer-events-none',
      )}
    >
      {/* Fades out (then stops rendering) rather than vanishing with the mini player. */}
      <div
        className={cn(
          'fixed inset-0 z-0 bg-black/60 backdrop-blur-xs transition-[opacity,visibility] duration-300',
          isCompactMode && 'invisible opacity-0',
        )}
        onClick={removePlayer}
      />
      <Player />
    </div>
  );
};

const Player = () => {
  const {
    currentEpisode,
    fullscreen,
    theatreMode,
    miniPlayer,
    videoPiPActive,
  } = usePlayer();
  const cardRef = useRef<HTMLDivElement>(null);

  const layout: PlayerLayout = miniPlayer
    ? 'mini'
    : videoPiPActive
      ? 'bar'
      : 'full';
  const startDrag = useMiniPlayerDrag(cardRef, layout);
  useLayoutTransition(cardRef, layout);

  return (
    <Card
      ref={cardRef}
      className={cn(
        // Position and size changes animate in mini-player-layout.ts; only
        // theatre mode's size and the corners use CSS transitions.
        'border-overlay relative z-10 box-content flex size-full overflow-hidden rounded-none border-none transition-[max-width,max-height,border-radius] duration-300 md:max-h-[720px] md:max-w-[1280px] md:rounded-[calc(var(--radius)+8px)] md:border',
        theatreMode && 'md:max-h-full md:max-w-full',
        fullscreen && 'max-h-full! max-w-full! rounded-none! border-none!',
        layout !== 'full' &&
          'pointer-events-auto fixed top-0 left-0 z-30 cursor-default rounded-xl border shadow-2xl data-dragging:cursor-grabbing data-dragging:select-none md:rounded-xl [&[data-dragging]_iframe]:pointer-events-none',
        layout === 'mini' &&
          'aspect-video h-auto w-[min(calc(100vw-1rem),420px)]',
        layout === 'bar' &&
          'bg-background/60 h-auto w-[min(calc(100vw-1rem),480px)] backdrop-blur-xl',
      )}
    >
      <PlayerIFrameEffects />
      {layout === 'mini' && (
        <div
          className="absolute inset-x-0 top-0 z-10 h-12 cursor-grab touch-none"
          onPointerDown={startDrag}
        />
      )}
      <CardContent
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col p-0 duration-300',
          layout === 'bar' &&
            'pointer-events-none invisible absolute inset-0 z-0',
        )}
      >
        <iframe
          id="player-iframe"
          key={`${currentEpisode?.episode}:${currentEpisode?.video_url}`}
          src={currentEpisode?.video_url}
          loading="lazy"
          className="size-full"
          allow="fullscreen; accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        ></iframe>
      </CardContent>
      {layout === 'bar' ? (
        <PlayerMiniBar onDragStart={startDrag} />
      ) : (
        <>
          {layout === 'full' && <PlayerMobileToolbar />}
          <PlayerNavbar onDragStart={startDrag} />
          <PlayerOverlay />
          {layout === 'full' && <WatchTogetherInvite />}
        </>
      )}
    </Card>
  );
};
