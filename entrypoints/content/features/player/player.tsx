import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { queryClient } from '../..';
import drawerStyles from '../../../../node_modules/vaul/style.css?inline';
import {
  type MiniPlayerCorner,
  PlayerProvider,
  usePlayer,
} from './context/player-context';
import PlayerMobileToolbar from './mobile-toolbar/player-mobile-toolbar';
import PlayerIFrameEffects from './player-iframe-effects';
import PlayerNavbar from './player-navbar';
import PlayerOverlay from './player-overlay/player-overlay';

const MOUNT_TAG = 'player-ui';

let playerUiPromise: Promise<ShadowRootContentScriptUi<Root>> | undefined;

export default function player() {
  playerUiPromise ??= createShadowRootUi<Root>(usePageStore.getState().ctx, {
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
      container.classList.toggle(
        'dark',
        getComputedStyle(document.documentElement).colorScheme === 'dark',
      );

      const style = document.createElement('style');
      style.textContent = drawerStyles;
      container.appendChild(style);

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <SidebarProvider className="h-full w-full">
            <PlayerProvider container={container}>
              <PlayerFrame />
              <Toaster position="top-center" />
            </PlayerProvider>
          </SidebarProvider>
        </QueryClientProvider>,
      );

      return root;
    },
    onRemove: (root) => {
      root?.unmount();

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

const MINI_PLAYER_MARGIN = 16;

const getMiniPlayerCornerStyle = (corner: MiniPlayerCorner): CSSProperties => {
  const style: CSSProperties = {};

  if (corner.includes('top')) style.top = MINI_PLAYER_MARGIN + 64;
  else style.bottom = MINI_PLAYER_MARGIN;

  if (corner.includes('left')) style.left = MINI_PLAYER_MARGIN;
  else style.right = MINI_PLAYER_MARGIN;

  return style;
};

const getMiniPlayerCornerPosition = (
  corner: MiniPlayerCorner,
  width: number,
  height: number,
): { left: number; top: number } => ({
  left: corner.includes('left')
    ? MINI_PLAYER_MARGIN
    : window.innerWidth - width - MINI_PLAYER_MARGIN,
  top: corner.includes('top')
    ? MINI_PLAYER_MARGIN + 64
    : window.innerHeight - height - MINI_PLAYER_MARGIN,
});

const getNearestMiniPlayerCorner = (
  left: number,
  top: number,
  width: number,
  height: number,
): MiniPlayerCorner => {
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const horizontal = centerX < window.innerWidth / 2 ? 'left' : 'right';
  const vertical = centerY < window.innerHeight / 2 ? 'top' : 'bottom';

  return `${vertical}-${horizontal}` as MiniPlayerCorner;
};

const PlayerFrame = () => {
  const { miniPlayer, container } = usePlayer();
  const { setOpen } = useSidebar();

  useEffect(() => {
    setOpen(!miniPlayer);
    container?.parentElement?.classList.toggle(
      'pointer-events-none',
      miniPlayer,
    );
    document.body.classList.toggle('h-full', !miniPlayer);
    document.body.classList.toggle('overflow-hidden', !miniPlayer);
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [miniPlayer, container]);

  return (
    <div
      className={cn(
        'relative size-full',
        miniPlayer
          ? 'pointer-events-none'
          : 'flex items-center justify-center bg-black/60 backdrop-blur-sm md:p-8',
      )}
    >
      {!miniPlayer && (
        <div className="fixed z-0 size-full" onClick={removePlayer} />
      )}
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
    miniPlayerCorner,
    setMiniPlayerCorner,
  } = usePlayer();

  const [getWatchedState, toggleWatchedState] = useState(false);
  const [dragPosition, setDragPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [isDraggingMiniPlayer, setIsDraggingMiniPlayer] = useState(false);
  const miniPlayerSnapTimeout = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (miniPlayerSnapTimeout.current) {
        window.clearTimeout(miniPlayerSnapTimeout.current);
      }
    },
    [],
  );

  const handleMiniPlayerDragStart = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!miniPlayer) return;

    const card = event.currentTarget.parentElement;
    if (!card) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = card.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    if (miniPlayerSnapTimeout.current) {
      window.clearTimeout(miniPlayerSnapTimeout.current);
      miniPlayerSnapTimeout.current = null;
    }

    setIsDraggingMiniPlayer(true);
    setDragPosition({ left: rect.left, top: rect.top });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const maxLeft = window.innerWidth - rect.width - MINI_PLAYER_MARGIN;
      const maxTop = window.innerHeight - rect.height - MINI_PLAYER_MARGIN;

      setDragPosition({
        left: Math.min(
          Math.max(MINI_PLAYER_MARGIN, moveEvent.clientX - offsetX),
          maxLeft,
        ),
        top: Math.min(
          Math.max(MINI_PLAYER_MARGIN, moveEvent.clientY - offsetY),
          maxTop,
        ),
      });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const left = Math.min(
        Math.max(MINI_PLAYER_MARGIN, upEvent.clientX - offsetX),
        window.innerWidth - rect.width - MINI_PLAYER_MARGIN,
      );
      const top = Math.min(
        Math.max(MINI_PLAYER_MARGIN, upEvent.clientY - offsetY),
        window.innerHeight - rect.height - MINI_PLAYER_MARGIN,
      );

      const nextCorner = getNearestMiniPlayerCorner(
        left,
        top,
        rect.width,
        rect.height,
      );

      setIsDraggingMiniPlayer(false);
      setMiniPlayerCorner(nextCorner);
      setDragPosition(
        getMiniPlayerCornerPosition(nextCorner, rect.width, rect.height),
      );
      miniPlayerSnapTimeout.current = window.setTimeout(() => {
        setDragPosition(null);
        miniPlayerSnapTimeout.current = null;
      }, 200);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const miniPlayerStyle: CSSProperties | undefined = miniPlayer
    ? (dragPosition ?? getMiniPlayerCornerStyle(miniPlayerCorner))
    : undefined;

  return (
    <Card
      style={miniPlayerStyle}
      onTransitionEnd={(event) => {
        if (
          event.currentTarget === event.target &&
          miniPlayer &&
          dragPosition &&
          !isDraggingMiniPlayer &&
          (event.propertyName === 'left' || event.propertyName === 'top')
        ) {
          if (miniPlayerSnapTimeout.current) {
            window.clearTimeout(miniPlayerSnapTimeout.current);
            miniPlayerSnapTimeout.current = null;
          }
          setDragPosition(null);
        }
      }}
      className={cn(
        'border-overlay relative z-10 box-content flex size-full overflow-hidden rounded-none border-none transition-all duration-300 md:max-h-[720px] md:max-w-[1280px] md:rounded-[calc(var(--radius)_+_8px)] md:border',
        theatreMode && 'md:max-h-full md:max-w-full',
        fullscreen &&
          'fixed inset-0 z-20 md:max-h-full md:max-w-full md:rounded-none',
        miniPlayer &&
          'pointer-events-auto fixed z-30 aspect-video h-auto w-[min(calc(100vw-1rem),420px)] cursor-default rounded-lg border shadow-2xl duration-150 md:w-[420px]',
        isDraggingMiniPlayer && 'duration-0',
      )}
    >
      <PlayerIFrameEffects
        toggleWatchedState={toggleWatchedState}
        watched={getWatchedState}
      />
      {miniPlayer && (
        <div
          className="absolute inset-x-0 top-0 z-10 h-9 cursor-grab active:cursor-grabbing"
          onPointerDown={handleMiniPlayerDragStart}
        />
      )}
      {!miniPlayer && (
        <PlayerMobileToolbar toggleWatchedState={toggleWatchedState} />
      )}
      <PlayerNavbar />
      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col p-0 duration-300">
        <iframe
          id="player-iframe"
          src={`${currentEpisode?.video_url}?site=hikka.io`} // todo: move params to backend
          loading="lazy"
          className="size-full"
          allow="fullscreen; accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        ></iframe>
      </CardContent>
      <PlayerOverlay toggleWatchedState={toggleWatchedState} />
    </Card>
  );
};
