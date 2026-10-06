import { QueryClientProvider } from '@tanstack/react-query';
import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
// import { Toaster } from '@/components/ui/sonner';
import { useIFramePlayer } from '@/hooks/use-iframe-player';
import { syncFeatureTheme } from '@/utils/utils';

import { queryClient } from '../..';
import { PlayerProvider, usePlayer } from './context/player-context';
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

const MOUNT_TAG = 'player-ui';

let playerUiPromise: ReturnType<typeof createShadowRootUi> | undefined;

export default function player() {
  playerUiPromise ??= createShadowRootUi(usePageStore.getState().ctx, {
    name: MOUNT_TAG,
    position: 'modal',
    zIndex: 100,
    inheritStyles: true,
    onMount(container) {
      usePlayer.getState().setContainer(container);

      const wrapper = document.createElement('div');
      container.append(wrapper);

      wrapper.className = 'size-full';

      container.className = 'h-full';
      syncFeatureTheme(container);

      const style = document.createElement('style');
      container.appendChild(style);

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <SidebarProvider className="h-full w-full">
            <PlayerProvider container={container}>
              <PlayerFrame />
              {/*<Toaster position="top-center" />*/}
            </PlayerProvider>
          </SidebarProvider>
        </QueryClientProvider>,
      );

      return root;
    },
    onRemove: (root) => {
      root?.unmount();

      const { fullscreen, toggleFullscreen, setVideoPiPActive } =
        usePlayer.getState();
      if (fullscreen) toggleFullscreen();
      setVideoPiPActive(false);
      document.body.classList.remove('h-full');
      document.body.classList.remove('overflow-hidden');

      useIFramePlayer.getState().reset();
      playerUiPromise = undefined;
    },
  });

  return playerUiPromise;
}

export const isPlayerMounted = () =>
  !!document.getElementsByTagName(MOUNT_TAG)[0];

export const removePlayer = () => {
  playerUiPromise?.then((ui) => {
    if (ui.mounted || document.getElementsByTagName(MOUNT_TAG)[0]) {
      ui.remove();
    }
  });
};

const PlayerFrame = () => {
  const { miniPlayer, videoPiPActive, container } = usePlayer();
  const { disableBlur } = useSettings().features.player;
  const { setOpen } = useSidebar();

  const isCompactMode = miniPlayer || videoPiPActive;

  // A layout effect: the page must settle before the player measures its
  // new size for the mini player transition.
  useLayoutEffect(() => {
    setOpen(!isCompactMode);
    container?.parentElement?.classList.toggle(
      'pointer-events-none',
      isCompactMode,
    );
    document.body.classList.toggle('h-full', !isCompactMode);
    document.body.classList.toggle('overflow-hidden', !isCompactMode);
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [isCompactMode, container]);

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

export const Player = () => {
  const {
    currentEpisode,
    fullscreen,
    theatreMode,
    miniPlayer,
    videoPiPActive,
  } = usePlayer();
  const [getWatchedState, toggleWatchedState] = useState(false);
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
      <PlayerIFrameEffects
        toggleWatchedState={toggleWatchedState}
        watched={getWatchedState}
      />
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
          {layout === 'full' && (
            <PlayerMobileToolbar toggleWatchedState={toggleWatchedState} />
          )}
          <PlayerNavbar onDragStart={startDrag} />
          <PlayerOverlay toggleWatchedState={toggleWatchedState} />
        </>
      )}
    </Card>
  );
};
