import {
  Fragment,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import MaterialSymbolsLiveTvRounded from '~icons/material-symbols/live-tv-rounded';
import MaterialSymbolsMicRounded from '~icons/material-symbols/mic-rounded';
import MaterialSymbolsSubtitlesRounded from '~icons/material-symbols/subtitles-rounded';

import type { ReleaseNotification } from '@/utils/convex-api';

import { onDrawerLinkClick } from '@/components/hikka/nav-styles';

import {
  type ReleaseRun,
  SLOT_ATTRIBUTE,
  formatTimestamp,
  placeReleases,
  readHikkaFeed,
  sameFeed,
} from './feed-layout';
import { useReleaseNotifications } from './use-release-notifications';

/** Class names copied from hikka.io's notification menu, so its CSS has them. */
const SECTION_LABEL =
  'border-border border-b surface-inset px-3 py-1.5 font-medium text-muted-foreground text-xs';
const ITEM =
  'group/item flex gap-3 border-border border-t border-l-4 px-3 py-2.5 transition-colors hover:bg-muted';
const ITEM_UNSEEN = 'border-l-primary-foreground/60 bg-primary-foreground/10';
const MARKDOWN =
  'prose prose-inline text-muted-foreground text-xs! group-hover/item:text-foreground';
/** Hikka's colours for episode releases ("schedule" notifications). */
const TYPE_BADGE =
  'absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-sm border [&_svg]:size-2.5 bg-warning text-warning-foreground border-warning-border';

const TRANSLATION_SUFFIX = {
  dub: ' в озвученні',
  sub: ' із субтитрами',
  unknown: '',
} satisfies Record<NonNullable<ReleaseNotification['translationType']>, string>;

const TYPE_ICON = {
  dub: <MaterialSymbolsMicRounded />,
  sub: <MaterialSymbolsSubtitlesRounded />,
  unknown: <MaterialSymbolsLiveTvRounded />,
} satisfies Record<
  NonNullable<ReleaseNotification['translationType']>,
  unknown
>;

/**
 * Release notifications among hikka.io's own in its open menu's `list`.
 * Hikka's React owns the list, so each run of ours is rendered into an
 * element of our own put before the Hikka element it precedes, and moved
 * whenever Hikka changes the list (a page loaded, a day label added).
 */
export function MenuFeed({ list }: { list: HTMLElement }) {
  const { data, enabled, refetch, markSeen } = useReleaseNotifications();
  // The menu mounts this as it opens; Hikka's dates and days date from then too.
  const [now] = useState(Date.now);
  const feed = useHikkaFeed(list, now);
  const runs = useMemo(
    () => placeReleases(feed, data.notifications, now),
    [feed, data.notifications, now],
  );
  const slots = useRunSlots(list, runs);
  const shown = runs.length > 0;

  // Mounted as the menu opens, which is when fresh data matters most.
  useEffect(() => {
    if (enabled) void refetch();
  }, [enabled, refetch]);

  useEffect(() => {
    if (feed.empty && shown) return hideNativeElement(feed.empty);
  }, [feed.empty, shown]);

  return runs.map((run, index) =>
    createPortal(
      run.entries.map(({ notification, label }) => (
        <Fragment key={notification.id}>
          {label && <div className={SECTION_LABEL}>{label}</div>}
          <ReleaseItem
            notification={notification}
            now={now}
            onOpen={() => markSeen(notification)}
          />
        </Fragment>
      )),
      slots[index]!,
      String(index),
    ),
  );
}

/** Hikka's part of the list, read again whenever its children change. */
function useHikkaFeed(list: HTMLElement, now: number) {
  const [feed, setFeed] = useState(() => readHikkaFeed(list, now));

  useEffect(() => {
    const update = () =>
      setFeed((current) => {
        const next = readHikkaFeed(list, now);
        return sameFeed(current, next) ? current : next;
      });
    // Our own moves land here too, but leave the feed as it was.
    const observer = new MutationObserver(update);
    observer.observe(list, { childList: true });
    update();
    return () => observer.disconnect();
  }, [list, now]);

  return feed;
}

/** An element in the list per run, right before the run's anchor. */
function useRunSlots(list: HTMLElement, runs: ReleaseRun[]) {
  const [slots] = useState<HTMLElement[]>([]);
  while (slots.length < runs.length) {
    const slot = document.createElement('div');
    slot.setAttribute(SLOT_ATTRIBUTE, '');
    // Lays the items out as the list's own children.
    slot.style.display = 'contents';
    slots.push(slot);
  }

  useLayoutEffect(() => {
    slots.forEach((slot, index) => {
      const run = runs[index];
      if (!run) {
        slot.remove();
        return;
      }
      // Hikka just removed it; the next read places the run again.
      if (run.anchor && run.anchor.parentNode !== list) return;
      if (slot.parentNode !== list || slot.nextElementSibling !== run.anchor) {
        list.insertBefore(slot, run.anchor);
      }
    });
  }, [list, runs, slots]);

  useLayoutEffect(
    () => () => {
      for (const slot of slots) slot.remove();
    },
    [slots],
  );

  return slots;
}

/** Mirrors hikka.io's `NotificationItem` for an episode release. */
function ReleaseItem({
  notification,
  now,
  onOpen,
}: {
  notification: ReleaseNotification;
  now: number;
  onOpen: () => void;
}) {
  const title = notification.animeTitle ?? 'Новий епізод';
  const translation = notification.translationType ?? 'unknown';
  const time = formatTimestamp(notification.createdAt, now);

  return (
    <div
      className={`${ITEM} ${notification.seen ? 'border-l-transparent' : ITEM_UNSEEN}`}
    >
      <LeadingVisual
        image={notification.animeImage}
        icon={TYPE_ICON[translation]}
      />

      <div className="relative flex min-w-0 flex-1 flex-col gap-1">
        <a
          href={`/anime/${notification.animeSlug}`}
          aria-label={title}
          className="absolute inset-0 z-10"
          onClick={(event) => {
            onOpen();
            // Opens it in place and closes the menu, as Hikka's items do.
            onDrawerLinkClick(event);
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm leading-tight font-medium">
            {title}
          </span>
        </div>
        <div className={`${MARKDOWN} line-clamp-2`}>
          <p>
            Команда <strong>{notification.teamTitle}</strong> випустила{' '}
            <strong>{notification.episodeNumber}</strong> епізод
            {TRANSLATION_SUFFIX[translation]}
          </p>
        </div>
        {notification.episodeTitle && (
          <blockquote className="border-muted-foreground/20 mt-0.5 border-l-2 pl-2">
            <div className={`${MARKDOWN} line-clamp-1`}>
              <p>{notification.episodeTitle}</p>
            </div>
          </blockquote>
        )}
        <time
          dateTime={time.iso}
          title={time.full}
          className="text-muted-foreground shrink-0 text-xs opacity-60 group-hover/item:opacity-100"
        >
          {time.label}
        </time>
      </div>
    </div>
  );
}

/** The poster with a corner badge, or the badge's icon alone without one. */
function LeadingVisual({ image, icon }: { image?: string; icon: ReactNode }) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return (
      <div className="border-border bg-secondary/40 flex size-10 shrink-0 items-center justify-center rounded-md border [&_svg]:size-5">
        {icon}
      </div>
    );
  }

  return (
    <div className="relative size-10 shrink-0">
      <span className="relative flex size-10 shrink-0 overflow-hidden rounded-md">
        <img
          src={image}
          alt=""
          className="aspect-square size-full rounded-md object-cover"
          onError={() => setFailed(true)}
        />
      </span>
      <div className={TYPE_BADGE}>{icon}</div>
    </div>
  );
}

export function hideNativeElement(element: HTMLElement) {
  const wasHidden = element.hidden;
  element.hidden = true;
  return () => {
    element.hidden = wasHidden;
  };
}
