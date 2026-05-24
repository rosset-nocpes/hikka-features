import { usePlayer } from '../context/player-context';

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
  const { miniPlayer } = usePlayer();

  return (
    <div
      className={cn(
        'pointer-events-none flex items-center gap-1 font-medium tabular-nums',
        miniPlayer ? 'text-xs' : 'text-sm',
      )}
    >
      {formatTime(currentTime)}
      {!miniPlayer && (
        <>
          <div className="text-white/80">/</div>
          {formatTime(duration)}
        </>
      )}
    </div>
  );
};

export default TimeGroup;
