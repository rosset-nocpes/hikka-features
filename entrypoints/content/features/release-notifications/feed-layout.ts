import type { ReleaseNotification } from '@/utils/convex-api';

/**
 * Where release notifications go in hikka.io's notification menu: among
 * Hikka's own, newest first, under its day labels, as if Hikka had sent them.
 */

/** hikka.io's day labels in the menu, newest first. */
export const SECTION_LABELS = ['Сьогодні', 'Вчора', 'Раніше'] as const;

/** On the extension's elements in the list, so reading it skips them. */
export const SLOT_ATTRIBUTE = 'data-hf-release-slot';
const OWN_ELEMENTS = `[${SLOT_ATTRIBUTE}], release-notifications`;

/** One of hikka.io's children of the list. */
interface HikkaEntry {
  node: Element;
  kind: 'label' | 'item' | 'other';
  /** Index into `SECTION_LABELS`; past the end for what follows them all. */
  section: number;
  /** When an item was sent; labels come before every item of theirs. */
  time: number;
}

export interface HikkaFeed {
  entries: HikkaEntry[];
  /** Hikka's own notifications are in, not its loading placeholders. */
  loaded: boolean;
  /** Hikka has older notifications to load ("Показати ще"). */
  hasMore: boolean;
  /** Hikka's "Сповіщень не знайдено", shown while it has none. */
  empty?: HTMLElement;
}

/** Notifications to put before one of Hikka's elements, or at the end. */
export interface ReleaseRun {
  anchor: Element | null;
  entries: { notification: ReleaseNotification; label?: string }[];
}

/** The day label a time goes under, as hikka.io groups them (local days). */
export function sectionOf(time: number, now: number) {
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  if (time >= day.getTime()) return 0;
  day.setDate(day.getDate() - 1);
  return time >= day.getTime() ? 1 : 2;
}

export function readHikkaFeed(list: HTMLElement, now: number): HikkaFeed {
  const entries: HikkaEntry[] = [];
  let empty: HTMLElement | undefined;
  let section: number | undefined;

  for (const node of list.children) {
    if (node.matches(OWN_ELEMENTS)) continue;
    if (node.matches('[data-slot="empty"]')) {
      empty = node as HTMLElement;
      continue;
    }

    // Labels hold bare text; their loading placeholders hold elements.
    const label = SECTION_LABELS.indexOf(
      node.textContent?.trim() as (typeof SECTION_LABELS)[number],
    );
    if (label >= 0 && node.childElementCount === 0) {
      section = label;
      entries.push({ node, kind: 'label', section, time: Infinity });
      continue;
    }

    const time = Date.parse(
      node.querySelector('time[datetime]')?.getAttribute('datetime') ?? '',
    );
    entries.push(
      Number.isNaN(time)
        ? { node, kind: 'other', section: SECTION_LABELS.length, time: 0 }
        : {
            node,
            kind: 'item',
            section: section ?? sectionOf(time, now),
            time,
          },
    );
  }

  return {
    entries,
    loaded: !!empty || entries.some((entry) => entry.kind === 'item'),
    hasMore: entries.some(
      (entry) => entry.kind === 'other' && entry.node.querySelector('button'),
    ),
    empty,
  };
}

export function sameFeed(a: HikkaFeed, b: HikkaFeed) {
  return (
    a.loaded === b.loaded &&
    a.hasMore === b.hasMore &&
    a.empty === b.empty &&
    a.entries.length === b.entries.length &&
    a.entries.every((entry, index) => {
      const other = b.entries[index];
      return (
        entry.node === other?.node &&
        entry.section === other.section &&
        entry.time === other.time
      );
    })
  );
}

/**
 * Places each notification before the first of Hikka's elements that comes
 * after it: a later day's label, an older item, or "Показати ще". A day
 * Hikka has no label for gets one of ours. While Hikka has more to load,
 * notifications older than all of its loaded ones wait, or its next page
 * would land above them.
 */
export function placeReleases(
  feed: HikkaFeed,
  notifications: readonly ReleaseNotification[],
  now: number,
): ReleaseRun[] {
  if (!feed.loaded) return [];

  const items = feed.entries.filter((entry) => entry.kind === 'item');
  const oldest = feed.hasMore
    ? Math.min(...items.map((entry) => entry.time))
    : -Infinity;
  const labelled = new Set(
    feed.entries
      .filter((entry) => entry.kind === 'label')
      .map((entry) => entry.section),
  );

  const runs: ReleaseRun[] = [];
  let previousSection: number | undefined;
  for (const notification of [...notifications].sort(
    (a, b) => b.createdAt - a.createdAt,
  )) {
    const time = notification.createdAt;
    if (time < oldest) break;

    const section = sectionOf(time, now);
    const anchor =
      feed.entries.find(
        (entry) =>
          entry.section > section ||
          (entry.section === section && entry.time < time),
      )?.node ?? null;
    let run = runs.at(-1);
    if (!run || run.anchor !== anchor) {
      run = { anchor, entries: [] };
      runs.push(run);
    }
    run.entries.push({
      notification,
      label:
        section !== previousSection && !labelled.has(section)
          ? SECTION_LABELS[section]
          : undefined,
    });
    previousSection = section;
  }
  return runs;
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
