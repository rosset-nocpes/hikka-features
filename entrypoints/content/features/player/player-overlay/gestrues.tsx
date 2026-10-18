import { useCallback, useEffect, useRef } from 'react';

import { useSidebar } from '@/components/ui/sidebar';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { usePlayer } from '../context/player-context';
import { removePlayer } from '../player';
import { dispatchPlayerOverlayAction } from './action-popup';

const Gestrues = () => {
  const gestrueRef = useRef<HTMLDivElement>(null);
  const speedupRef = useRef(false);
  const pointerTypeRef = useRef<string | null>(null);
  const hideUiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSeekTimeRef = useRef<number | null>(null);
  const skipTotalRef = useRef(0);
  const skipResetTimerRef = useRef<NodeJS.Timeout>(null);
  const {
    play,
    pause,
    isPlaying,
    uiShown,
    currentTime,
    duration,
    seek,
    toggleMute,
    changeVolume,
    isMuted,
    volume,
  } = useIFramePlayer();
  const { toggleFullscreen, toggleTheatreMode, overlayRef, miniPlayer } =
    usePlayer();
  const { open, setOpen } = useSidebar();

  const scheduleHideOverlayUi = useCallback(() => {
    if (hideUiTimerRef.current) {
      clearTimeout(hideUiTimerRef.current);
    }
    hideUiTimerRef.current = setTimeout(() => {
      const { isPlaying, uiLocked } = useIFramePlayer.getState();
      if (!isPlaying || uiLocked) return;
      useIFramePlayer.setState({ uiShown: false });
    }, 4000);
  }, []);

  const showOverlayUi = useCallback(() => {
    useIFramePlayer.setState({ uiShown: true });
    scheduleHideOverlayUi();
  }, [scheduleHideOverlayUi]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
      dispatchPlayerOverlayAction(overlayRef.current, { type: 'pause' });
    } else {
      play();
      dispatchPlayerOverlayAction(overlayRef.current, { type: 'play' });
    }
  }, [isPlaying, overlayRef, play, pause]);

  const handleSkip = useCallback(
    (seconds: number) => {
      const baseTime = pendingSeekTimeRef.current ?? currentTime;
      const newTime =
        duration > 0
          ? Math.min(Math.max(0, baseTime + seconds), duration)
          : Math.max(0, baseTime + seconds);
      const nextSkipTotal =
        Math.sign(skipTotalRef.current) === Math.sign(seconds)
          ? skipTotalRef.current + seconds
          : seconds;

      pendingSeekTimeRef.current = newTime;
      skipTotalRef.current = nextSkipTotal;
      seek(newTime);
      dispatchPlayerOverlayAction(overlayRef.current, {
        type: 'skip',
        seconds: nextSkipTotal,
      });

      if (skipResetTimerRef.current) {
        clearTimeout(skipResetTimerRef.current);
      }

      skipResetTimerRef.current = setTimeout(() => {
        pendingSeekTimeRef.current = null;
        skipTotalRef.current = 0;
      }, 750);
    },
    [currentTime, duration, overlayRef, seek],
  );

  const handleToggleMute = useCallback(() => {
    toggleMute();
    dispatchPlayerOverlayAction(overlayRef.current, {
      type: isMuted || volume === 0 ? 'unmute' : 'mute',
    });
  }, [isMuted, overlayRef, toggleMute, volume]);

  const handleVolumeStep = useCallback(
    (delta: number) => {
      // `changeVolume` takes an absolute level, not a delta.
      const base = isMuted ? 0 : volume;
      const next = Math.round(Math.min(1, Math.max(0, base + delta)) * 100);
      if (isMuted && next > 0) toggleMute();
      changeVolume(next / 100);
      dispatchPlayerOverlayAction(overlayRef.current, {
        type: 'volume',
        percent: next,
      });
    },
    [changeVolume, isMuted, overlayRef, toggleMute, volume],
  );

  const handleSeekTo = useCallback(
    (time: number) => {
      pendingSeekTimeRef.current = null;
      skipTotalRef.current = 0;
      seek(time);
      showOverlayUi();
    },
    [seek, showOverlayUi],
  );

  useEffect(() => {
    return () => {
      if (skipResetTimerRef.current) {
        clearTimeout(skipResetTimerRef.current);
      }
      if (hideUiTimerRef.current) {
        clearTimeout(hideUiTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || !uiShown) {
      if (hideUiTimerRef.current) {
        clearTimeout(hideUiTimerRef.current);
        hideUiTimerRef.current = null;
      }
      return;
    }

    scheduleHideOverlayUi();
  }, [isPlaying, scheduleHideOverlayUi, uiShown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // The player lives in a shadow root, so `e.target` is its host; the
      // composed path has the element that actually has focus.
      const target = e.composedPath()[0] as HTMLElement;
      if (
        (e.target as HTMLElement).tagName === 'BUTTON' ||
        target.isContentEditable ||
        target.closest?.('input, textarea, [role=dialog], [role=menu]')
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (/^\d$/.test(e.key)) {
        if (duration <= 0) return;
        e.preventDefault();
        handleSeekTo((Number(e.key) / 10) * duration);
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          if (miniPlayer) break;
          e.preventDefault();
          toggleFullscreen();
          break;
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'm':
          e.preventDefault();
          handleToggleMute();
          break;
        case 's':
          if (miniPlayer) break;
          e.preventDefault();
          setOpen(!open);
          break;
        case 't':
          if (miniPlayer) break;
          e.preventDefault();
          toggleTheatreMode();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSkip(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          handleSkip(5);
          break;
        case 'j':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'l':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'home':
          e.preventDefault();
          handleSeekTo(0);
          break;
        case 'end':
          if (duration <= 0) break;
          e.preventDefault();
          handleSeekTo(Math.max(0, duration - 1));
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeStep(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeStep(-0.1);
          break;
        case 'escape':
          e.preventDefault();
          removePlayer();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    open,
    miniPlayer,
    duration,
    setOpen,
    togglePlayPause,
    toggleFullscreen,
    toggleTheatreMode,
    handleSkip,
    handleSeekTo,
    handleVolumeStep,
    handleToggleMute,
  ]);

  // Hold on the video for 2x playback.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    let holdTimer: NodeJS.Timeout | null = null;
    let restoreSpeed: number | null = null;

    const cancelHold = () => {
      if (!holdTimer) return;
      clearTimeout(holdTimer);
      holdTimer = null;
    };

    const handleHoldStart = (event: MouseEvent | TouchEvent) => {
      speedupRef.current = false;
      if (event instanceof MouseEvent && event.button !== 0) return;
      // Holding a control (e.g. dragging the seek bar) must not speed up.
      if ((event.target as Element).closest?.('[data-player-controls]')) return;

      cancelHold();
      holdTimer = setTimeout(() => {
        holdTimer = null;
        const { currentSpeed, changeSpeed } = useIFramePlayer.getState();
        restoreSpeed = currentSpeed;
        speedupRef.current = true;
        changeSpeed(2);
        dispatchPlayerOverlayAction(el, {
          type: 'speedup',
          active: true,
          speed: 2,
        });
      }, 1000);
    };

    const handleHoldEnd = () => {
      cancelHold();
      if (restoreSpeed === null) return;
      useIFramePlayer.getState().changeSpeed(restoreSpeed);
      restoreSpeed = null;
      dispatchPlayerOverlayAction(el, {
        type: 'speedup',
        active: false,
        speed: 2,
      });
    };

    const handleContextMenu = (event: Event) => {
      // Touch long-presses open the context menu otherwise.
      if (holdTimer || restoreSpeed !== null) event.preventDefault();
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerTypeRef.current = event.pointerType;
    };

    const handleTouchStart = (event: TouchEvent) => {
      pointerTypeRef.current = 'touch';
      handleHoldStart(event);
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('mousedown', handleHoldStart);
    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('mouseup', handleHoldEnd);
    el.addEventListener('touchend', handleHoldEnd);
    el.addEventListener('mouseleave', handleHoldEnd);
    el.addEventListener('contextmenu', handleContextMenu);

    return () => {
      handleHoldEnd();
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('mousedown', handleHoldStart);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('mouseup', handleHoldEnd);
      el.removeEventListener('touchend', handleHoldEnd);
      el.removeEventListener('mouseleave', handleHoldEnd);
      el.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [overlayRef]);

  return (
    <div
      ref={gestrueRef}
      className="flex flex-1 focus:ring-0 focus:outline-hidden"
      onClick={() => {
        if (speedupRef.current) return;
        if (pointerTypeRef.current !== 'mouse' && !uiShown) {
          showOverlayUi();
          return;
        }
        togglePlayPause();
      }}
      onDoubleClick={() => {
        if (pointerTypeRef.current !== 'mouse' || miniPlayer) return;
        toggleFullscreen();
      }}
      tabIndex={0}
    />
  );
};

export default Gestrues;
