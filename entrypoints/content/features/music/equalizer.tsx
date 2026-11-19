/** Delays and lengths per bar, so they don't move in step. */
const BARS = [
  { delay: '-0.4s', duration: '0.9s' },
  { delay: '-0.1s', duration: '0.7s' },
  { delay: '-0.6s', duration: '1s' },
];

/** Bouncing bars for the track that plays; still while it's paused. */
const Equalizer = ({
  playing,
  className,
}: {
  playing: boolean;
  className?: string;
}) => (
  <span aria-hidden className={cn('flex h-3.5 items-end gap-0.5', className)}>
    {BARS.map(({ delay, duration }, index) => (
      <span
        key={index}
        className="h-full w-0.75 origin-bottom rounded-full bg-current motion-safe:animate-[equalizer_var(--duration)_ease-in-out_infinite] motion-reduce:scale-y-60"
        style={
          {
            '--duration': duration,
            animationDelay: delay,
            animationPlayState: playing ? 'running' : 'paused',
          } as React.CSSProperties
        }
      />
    ))}
  </span>
);

export default Equalizer;
