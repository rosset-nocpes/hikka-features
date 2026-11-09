import { type FC, use, useMemo } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ContainerContext } from './parts';

/** Fewer posts than this say nothing about a team's habits. */
const MIN_RELEASES = 10;
/** The backend's cap on the release times it sends. */
const MAX_RELEASES = 500;
/** A day this far above an even share is the team's day. */
const PEAK_SHARE = 1.4;

/** Monday first, as in Ukraine. */
const DAYS = [
  { short: 'Пн', name: 'понеділок', on: 'у понеділок' },
  { short: 'Вт', name: 'вівторок', on: 'у вівторок' },
  { short: 'Ср', name: 'середа', on: 'у середу' },
  { short: 'Чт', name: 'четвер', on: 'у четвер' },
  { short: 'Пт', name: "п'ятниця", on: "у п'ятницю" },
  { short: 'Сб', name: 'субота', on: 'у суботу' },
  { short: 'Нд', name: 'неділя', on: 'у неділю' },
];

const plural = new Intl.PluralRules('uk');
const RELEASE_FORMS: Partial<Record<Intl.LDMLPluralRule, string>> = {
  one: 'реліз',
  few: 'релізи',
};
const releasesWord = (count: number) =>
  RELEASE_FORMS[plural.select(count)] ?? 'релізів';

const since = new Intl.DateTimeFormat('uk', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const hour = new Intl.DateTimeFormat('uk', {
  hour: '2-digit',
  minute: '2-digit',
});

/** Posts per weekday and per hour, in the viewer's own time. */
function countDays(times: number[]) {
  const days = Array.from({ length: 7 }, () => 0);
  const hours = Array.from({ length: 24 }, () => 0);
  for (const time of times) {
    const date = new Date(time);
    days[(date.getDay() + 6) % 7]! += 1;
    hours[date.getHours()]! += 1;
  }
  const max = Math.max(...days);
  const peaks = days.flatMap((count, day) =>
    count === max && count >= (times.length / 7) * PEAK_SHARE ? [day] : [],
  );
  const usualHour = hours.indexOf(Math.max(...hours));
  return { days, max, peaks, usualHour };
}

/** What the chart says in words: the team's day, if it has one. */
function headline(peaks: number[]) {
  if (peaks.length === 0)
    return 'Без сталого дня: релізи виходять упродовж тижня';
  return `Найчастіше — ${peaks.map((day) => DAYS[day]!.on).join(' й ')}`;
}

/**
 * Which weekdays a team's releases come out on, counted from when its
 * release posts went up on Telegram (in the viewer's time zone): a short
 * summary beside small bars in hikka's accent colour.
 */
const ReleaseDays: FC<{ times: number[] }> = ({ times }) => {
  const container = use(ContainerContext);
  const { days, max, peaks, usualHour } = useMemo(
    () => countDays(times),
    [times],
  );
  if (times.length < MIN_RELEASES) return null;

  const oldest = new Date(Math.min(...times));
  const usual = new Date(oldest);
  usual.setHours(usualHour, 0, 0, 0);
  const period = `${times.length >= MAX_RELEASES ? 'останні' : 'усі'} ${times.length} ${releasesWord(times.length)} з ${since.format(oldest)}`;

  return (
    <div className="surface border-border flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-muted-foreground text-xs">Дні релізів</span>
        <p className="text-sm leading-5 font-medium text-balance">
          {headline(peaks)}
        </p>
        <p className="text-muted-foreground text-xs leading-4 text-pretty">
          Зазвичай близько {hour.format(usual)} · {period}
        </p>
      </div>
      <div
        role="img"
        aria-label={DAYS.map(({ name }, day) => `${name}: ${days[day]}`).join(
          ', ',
        )}
        className="grid shrink-0 grid-cols-7 gap-1.5 sm:w-64"
      >
        {DAYS.map(({ short, name }, day) => {
          const count = days[day]!;
          const peak = peaks.includes(day);
          const share = Math.round((count / times.length) * 100);
          const label = peak
            ? 'text-foreground font-medium'
            : 'text-muted-foreground';
          return (
            <Tooltip key={short}>
              <TooltipTrigger
                render={<div className="flex flex-col items-center gap-1" />}
              >
                <span className={cn('text-xs leading-4 tabular-nums', label)}>
                  {count}
                </span>
                <div className="flex h-14 w-full items-end sm:h-10">
                  <div
                    style={{ height: `${(count / max) * 100}%` }}
                    className={cn(
                      'min-h-1 w-full rounded-sm',
                      peak
                        ? 'bg-primary'
                        : 'bg-[color-mix(in_oklab,var(--primary)_35%,var(--secondary))]',
                    )}
                  />
                </div>
                <span className={cn('text-xs leading-4', label)}>{short}</span>
              </TooltipTrigger>
              <TooltipContent container={container}>
                <span className="font-medium">
                  {name[0]!.toUpperCase() + name.slice(1)}
                </span>
                {` · ${count} ${releasesWord(count)}, ${share}%`}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default ReleaseDays;
