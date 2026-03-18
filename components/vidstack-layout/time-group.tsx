import { Time } from '@vidstack/react';

export function TimeGroup() {
  return (
    <div className="pointer-events-none flex items-center gap-1 text-sm font-medium">
      <Time className="time" type="current" />
      <div className="text-white/80">/</div>
      <Time className="time" type="duration" />
    </div>
  );
}
