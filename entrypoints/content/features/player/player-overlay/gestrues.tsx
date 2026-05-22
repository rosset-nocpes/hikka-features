import { useCallback, useEffect, useRef } from 'react';

import { useSidebar } from '@/components/ui/sidebar';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { usePlayer } from '../context/player-context';
import { removePlayer } from '../player';
import { dispatchPlayerOverlayAction } from './action-popup';

const Gestrues = () => {
  const gestrueRef = useRef<HTMLDivElement>(null);
  const speedupRef = useRef(false);
  const pendingSeekTimeRef = useRef<number | null>(null);
  const skipTotalRef = useRef(0);
  const skipResetTimerRef = useRef<NodeJS.Timeout>(null);
  const {
    play,
    pause,
    isPlaying,
    currentTime,
    duration,
    seek,
    toggleMute,
    changeVolume,
    isMuted,
    volume,
  } = useIFramePlayer();
  const { toggleFullscreen, overlayRef, miniPlayer } = usePlayer();
  const { open, setOpen } = useSidebar();

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

  useEffect(() => {
    return () => {
      if (skipResetTimerRef.current) {
        clearTimeout(skipResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.isContentEditable
      ) {
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
        case 'arrowleft':
          e.preventDefault();
          handleSkip(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          handleSkip(5);
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(-0.1);
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
    setOpen,
    togglePlayPause,
    toggleFullscreen,
    changeVolume,
    handleSkip,
    handleToggleMute,
  ]);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const handleMouseDown = () => {
      speedupRef.current = false;
    };

    const handleSpeedupStart = () => {
      speedupRef.current = true;
    };

    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('speedupstart', handleSpeedupStart);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('speedupstart', handleSpeedupStart);
    };
  }, [overlayRef]);

  return (
    <div
      ref={gestrueRef}
      className="flex flex-1 focus:outline-none focus:ring-0"
      onClick={() => {
        if (speedupRef.current) return;
        togglePlayPause();
      }}
      tabIndex={0}
    />
  );
};

export default Gestrues;
