import { Time } from '@vidstack/react';

export function TimeGroup() {
  return (
    <div className="ml-2.5 flex items-center font-medium text-sm">
      <Time className="time" type="current" />
      <div className="mx-1 text-white/80">/</div>
      <Time className="time" type="duration" />
    </div>
  );
}
