import { useEffect, useRef, useState } from 'react';
import MaterialSymbolsCoPresentRounded from '~icons/material-symbols/co-present-rounded';
import MaterialSymbolsLoginRounded from '~icons/material-symbols/login-rounded';

import type { WatchRoomInbox } from '@/utils/convex-api';

import { Avatar } from '@/components/ui/avatar';
import { STORAGE_KEYS } from '@/constants/storage';
import { useLiveQuery } from '@/hooks/use-live-query';
import { convexApi } from '@/utils/convex-api';
import { useHikkaViewer } from '@/utils/hikka-viewer';
import { liveConvex } from '@/utils/live-convex';
import { notify } from '@/utils/notify';
import { plural } from '@/utils/plural';
import { StoredValue } from '@/utils/stored-value';

import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';
import { isPlayerOpen } from './player/player';
import {
  MemberFace,
  memberName,
  RoomSubtitle,
} from './player/watch-together/menu';
import { openRoom } from './player/watch-together/open-room';
import { useWatchTogether } from './player/watch-together/use-watch-together';

type Invite = WatchRoomInbox['invites'][number];

/**
 * Invites closed without an answer, in every tab: they stay in the inbox
 * (and the player's menu) but aren't shown again.
 */
const closedInvites = new StoredValue<string[]>(
  STORAGE_KEYS.watchTogetherClosedInvites,
);

/** Closes saved one after another, so two close together both stick. */
let savingClosed: Promise<void> = Promise.resolve();

const notificationId = (invite: Invite) => `watch-together-invite-${invite.id}`;

const VIEWERS = { one: 'глядач', few: 'глядачі', many: 'глядачів' };

/**
 * Shows watch together invites from friends as they arrive, on every page
 * and above the player, as notifications.
 */
export default class WatchTogetherInvitesFeature extends BaseFeature {
  readonly id = 'watch-together-invites';
  readonly pages = [HikkaPages.All];

  override get shouldMount(): boolean {
    return (
      super.shouldMount &&
      useSettings.getState().features.watchTogetherInvites.enabled
    );
  }

  async init() {
    this.ui = await this.createUi({
      position: 'inline',
      anchor: 'body',
      append: 'last',
      themeVariables: false,
      render: () => <InviteNotifications />,
    });
  }
}

/** Follows the inbox into notifications; renders nothing itself. */
const InviteNotifications = () => {
  // Only the Hikka user the extension is signed in as gets its invites.
  const signedIn = useHikkaViewer() === 'account';
  const inbox = useLiveQuery(
    convexApi.watchRooms.inbox,
    signedIn ? {} : 'skip',
  )?.data;
  const [closed, setClosed] = useState<ReadonlySet<string>>();
  // Answered here; hidden at once, before the inbox catches up.
  const answered = useRef(new Set<string>());
  const shown = useRef(new Map<string, Invite>());
  const inboxIds = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    void closedInvites.get().then((ids) => {
      if (active) setClosed((current) => current ?? new Set(ids));
    });
    const unwatch = closedInvites.watch((ids) => setClosed(new Set(ids)));
    return () => {
      active = false;
      unwatch();
    };
  }, []);

  useEffect(() => {
    const invites = signedIn ? inbox?.invites : [];
    if (!invites || !closed) return;
    inboxIds.current = new Set(invites.map(({ id }) => id));

    const visible = invites.filter(
      ({ id }) => !closed.has(id) && !answered.current.has(id),
    );
    const ids = new Set(visible.map(({ id }) => id));

    // Answered elsewhere, closed in another tab, or the room is gone.
    for (const [id, invite] of shown.current) {
      if (ids.has(id)) continue;
      shown.current.delete(id);
      notify.dismiss(notificationId(invite));
    }

    // Oldest first, so the newest ends up in front.
    for (const invite of [...visible].reverse()) {
      const previous = shown.current.get(invite.id);
      if (previous && sameListing(previous, invite)) continue;
      shown.current.set(invite.id, invite);
      showInvite(invite, {
        onAnswered: () => {
          answered.current.add(invite.id);
          shown.current.delete(invite.id);
        },
        onClosed: () => {
          shown.current.delete(invite.id);
          savingClosed = savingClosed
            .catch(() => undefined)
            .then(async () => {
              // Only ids still in the inbox, so the list doesn't grow forever.
              const ids = (await closedInvites.get()) ?? [];
              await closedInvites.set([
                ...ids.filter((id) => inboxIds.current.has(id)),
                invite.id,
              ]);
            });
          return savingClosed;
        },
      });
    }
  }, [signedIn, inbox, closed]);

  // Turned off: they go too.
  useEffect(
    () => () => {
      for (const invite of shown.current.values()) {
        notify.dismiss(notificationId(invite));
      }
      shown.current.clear();
    },
    [],
  );

  return null;
};

const sameListing = (a: Invite, b: Invite) =>
  a.memberCount === b.memberCount &&
  a.episode === b.episode &&
  a.animeTitle === b.animeTitle &&
  a.animeImage === b.animeImage &&
  a.friend.avatar === b.friend.avatar;

function showInvite(
  invite: Invite,
  {
    onAnswered,
    onClosed,
  }: { onAnswered: () => void; onClosed: () => Promise<void> },
) {
  const join = async () => {
    await openRoom(invite.animeSlug, invite.code);
    // Out of the page otherwise, to the anime's.
    if (!isPlayerOpen()) return onAnswered();
    const { status, error } = useWatchTogether.getState();
    if (status === 'joined') return onAnswered();
    notify.error('Не вдалося приєднатися', {
      id: 'watch-together-join-error',
      description: error,
    });
    // Kept, for another try.
    throw new Error(error ?? 'JOIN_FAILED');
  };

  const decline = async () => {
    onAnswered();
    await liveConvex
      .mutation(convexApi.watchRooms.decline, { id: invite.id })
      .catch(console.error);
  };

  notify({
    id: notificationId(invite),
    eyebrow: (
      <>
        <MaterialSymbolsCoPresentRounded />
        Спільний перегляд
      </>
    ),
    title: (
      <>
        <span className="font-semibold">{memberName(invite.friend)}</span>{' '}
        <span className="text-muted-foreground font-normal">
          запрошує дивитися разом
        </span>
      </>
    ),
    description: (
      <span className="grid gap-0.5">
        <RoomSubtitle
          title={invite.animeTitle ?? invite.animeSlug}
          episode={invite.episode}
        />
        {invite.memberCount > 1 && (
          <span>
            Уже в кімнаті: {invite.memberCount}{' '}
            {plural(invite.memberCount, VIEWERS)}
          </span>
        )}
      </span>
    ),
    media: <InviteMedia invite={invite} />,
    actions: [
      {
        label: 'Приєднатися',
        icon: <MaterialSymbolsLoginRounded />,
        primary: true,
        onClick: join,
      },
      { label: 'Відхилити', onClick: decline },
    ],
    duration: Infinity,
    urgent: true,
    onDismiss: (reason) => {
      if (reason === 'user') void onClosed().catch(console.error);
    },
  });
}

/** The anime's poster with the friend's avatar on its corner. */
const InviteMedia = ({ invite }: { invite: Invite }) => {
  const avatar = (
    <Avatar
      className={cn(
        invite.animeImage
          ? 'ring-popover absolute -right-2 -bottom-1.5 size-6 ring-2'
          : 'size-10',
      )}
    >
      <MemberFace member={invite.friend} />
    </Avatar>
  );

  if (!invite.animeImage) return avatar;

  return (
    <span className="relative block">
      <img
        src={invite.animeImage}
        alt=""
        className="bg-muted ring-foreground/10 block h-15 w-10 rounded-md object-cover ring-1"
      />
      {avatar}
    </span>
  );
};
