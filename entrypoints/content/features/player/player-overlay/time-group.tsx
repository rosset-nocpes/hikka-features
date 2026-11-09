import { useState } from 'react';

import ToolbarTooltip from './toolbar-tooltip';

export function formatTime(totalSeconds: number) {
  const s = Math.floor(totalSeconds);

  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    const mm = String(minutes).padStart(2, '0');
    return `${hours}:${mm}:${ss}`;
  } else {
    return `${minutes}:${ss}`;
  }
}

const TimeGroup = () => {
  const { currentTime, duration } = useIFramePlayer();
  const [showRemaining, setShowRemaining] = useState(false);

  return (
    <ToolbarTooltip
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
    </ToolbarTooltip>
  );
};

export default TimeGroup;
