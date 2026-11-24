/** A playback time, "4:05" or "1:02:03"; "0:00" for an unknown one. */
export function formatTime(totalSeconds: number) {
  const total = Number.isFinite(totalSeconds)
    ? Math.max(0, Math.floor(totalSeconds))
    : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(total % 60)}`
    : `${minutes}:${pad(total % 60)}`;
}

/** hikka.io's short month names (date-fns `uk`), which differ from Intl's. */
const MONTHS = [
  'січ.',
  'лют.',
  'берез.',
  'квіт.',
  'трав.',
  'черв.',
  'лип.',
  'серп.',
  'верес.',
  'жовт.',
  'листоп.',
  'груд.',
];
const relativeTime = new Intl.RelativeTimeFormat('uk', {
  numeric: 'always',
  style: 'narrow',
});
const dayAndMonth = new Intl.DateTimeFormat('uk', {
  day: 'numeric',
  month: 'long',
});

/**
 * A time as hikka.io's notifications show it (`formatTimestamp` in
 * @hikka/core): "5 хв тому" within a day, then "6 лип.", "6 лип. 2024".
 */
export function formatTimestamp(time: number, now: number) {
  const date = new Date(time);
  const seconds = Math.max(0, Math.floor((now - time) / 1_000));
  const year = date.getFullYear();

  let label: string;
  if (seconds < 60) {
    label = relativeTime.format(-Math.max(1, seconds), 'second');
  } else if (seconds < 60 * 60) {
    label = relativeTime.format(-Math.floor(seconds / 60), 'minute');
  } else if (seconds < 24 * 60 * 60) {
    label = relativeTime.format(-Math.floor(seconds / (60 * 60)), 'hour');
  } else {
    label = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
    if (year !== new Date(now).getFullYear()) label += ` ${year}`;
  }

  const clock = [date.getHours(), date.getMinutes()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
  return {
    label,
    full: `${clock} · ${dayAndMonth.format(date)} ${year}`,
    iso: date.toISOString(),
  };
}
