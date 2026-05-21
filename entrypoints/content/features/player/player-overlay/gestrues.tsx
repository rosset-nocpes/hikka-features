import { useCallback, useEffect, useRef } from 'react';

import { useSidebar } from '@/components/ui/sidebar';
import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { usePlayer } from '../context/player-context';

const Gestrues = () => {
  const gestrueRef = useRef<HTMLDivElement>(null);
  const speedupRef = useRef(false);
  const {
    play,
    pause,
    isPlaying,
    currentTime,
    seek,
    toggleMute,
    changeVolume,
  } = useIFramePlayer();
  const { toggleFullscreen, overlayRef, miniPlayer } = usePlayer();
  const { open, setOpen } = useSidebar();

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleSkip = useCallback(
    (seconds: number) => {
      const newTime = Math.max(0, currentTime + seconds);
      seek(newTime);
    },
    [currentTime, seek],
  );

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
          toggleMute();
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
    toggleMute,
    changeVolume,
    handleSkip,
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
