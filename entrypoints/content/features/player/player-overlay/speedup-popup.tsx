import { useRef, useEffect, useState } from 'react';
import MaterialSymbolsFastForwardOutlineRounded from '~icons/material-symbols/fast-forward-outline-rounded';

import { usePlayer } from '../context/player-context';

const SpeedupPopup = () => {
  const { currentSpeed, changeSpeed } = useIFramePlayer();
  const { overlayRef } = usePlayer();
  const [showPopup, setShowPopup] = useState(false);

  const originalSpeedRef = useRef<number>(1);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const isSpeedupTriggeredRef = useRef(false);

  const handleMouseDown = () => {
    originalSpeedRef.current = currentSpeed;
    timerRef.current = setTimeout(() => {
      changeSpeed(2);
      setShowPopup(true);
      isSpeedupTriggeredRef.current = true;
      overlayRef.current?.dispatchEvent(new CustomEvent('speedupstart'));
    }, 1000);
  };

  const handleMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (currentSpeed === 2) {
      changeSpeed(originalSpeedRef.current);
      setShowPopup(false);
    }
    isSpeedupTriggeredRef.current = false;
    overlayRef.current?.dispatchEvent(new CustomEvent('speedupend'));
  };

  useEffect(() => {
    const ref = overlayRef.current;
    if (!ref) return;

    ref.addEventListener('mousedown', handleMouseDown);
    ref.addEventListener('mouseup', handleMouseUp);
    ref.addEventListener('mouseleave', handleMouseUp);

    return () => {
      ref.removeEventListener('mousedown', handleMouseDown);
      ref.removeEventListener('mouseup', handleMouseUp);
      ref.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [overlayRef, currentSpeed]);

  return (
    <span
      className={cn(
        'absolute left-1/2 top-2 flex h-8 -translate-x-1/2 cursor-default items-center gap-1 rounded-md bg-background/60 px-2 font-medium backdrop-blur-xl duration-200 ease-out',
        !showPopup && '-translate-y-2 scale-90 opacity-0',
      )}
    >
      2x
      <MaterialSymbolsFastForwardOutlineRounded />
    </span>
  );
};

export default SpeedupPopup;
