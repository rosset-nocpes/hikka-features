import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsLoginRounded from '~icons/material-symbols/login-rounded';

import type { WatchRoomInbox } from '@/utils/convex-api';

import { useLiveQuery } from '@/hooks/use-live-query';
import { convexApi } from '@/utils/convex-api';
import { withLiveClient } from '@/utils/convex-client';
import { useHikkaViewer } from '@/utils/hikka-viewer';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';
import {
  MemberAvatar,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  memberName,
  RoomSubtitle,
} from './player/watch-together/menu';
import { openRoom } from './player/watch-together/open-room';

/** Invites shown at once; the rest wait for these to be answered. */
const MAX_TOASTS = 3;

type Invite = WatchRoomInbox['invites'][number];

/**
 * Shows watch together invites from friends as they arrive, on every page
 * and above the player, in the player's menu style.
 */
export default class WatchTogetherInvitesFeature extends BaseFeature {
  readonly id = 'watch-together-invites';
  readonly pages = [HikkaPages.All];

  async init() {
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      anchor: 'body',
      append: 'last',
      themeVariables: false,
      render: () => <InviteToasts />,
    });
  }
}

const InviteToasts = () => {
  // Only the Hikka user the extension is signed in as gets its invites.
  const inbox = useLiveQuery(
    convexApi.watchRooms.inbox,
    useHikkaViewer() === 'account' ? {} : 'skip',
  )?.data;
  // Hidden as soon as they are answered, before the inbox catches up.
  const [answered, setAnswered] = useState<ReadonlySet<string>>(new Set());

  const answer = (invite: Invite) =>
    setAnswered((current) => new Set(current).add(invite.id));

  const join = (invite: Invite) => {
    answer(invite);
    openRoom(invite.animeSlug, invite.code);
  };

  const decline = (invite: Invite) => {
    answer(invite);
    void withLiveClient((client) =>
      client.mutation(convexApi.watchRooms.decline, { id: invite.id }),
    ).catch(console.error);
  };

  const invites = (inbox?.invites ?? [])
    .filter((invite) => !answered.has(invite.id))
    .slice(0, MAX_TOASTS);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-2147483647 flex flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {invites.map((invite) => (
          <motion.div
            key={invite.id}
            layout
            role="alertdialog"
            aria-label="Запрошення до спільного перегляду"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 36 }}
            className="bg-popover/60 text-popover-foreground ring-foreground/10 pointer-events-auto flex w-full max-w-72 flex-col rounded-md p-1 text-sm shadow-md ring-1 backdrop-blur-xl"
          >
            <MenuLabel>Запрошення до спільного перегляду</MenuLabel>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <MemberAvatar
                member={invite.friend}
                className="-mx-0.5 data-[size=sm]:size-5"
              />
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate">{memberName(invite.friend)}</span>
                <RoomSubtitle
                  title={invite.animeTitle ?? invite.animeSlug}
                  episode={invite.episode}
                />
              </span>
            </div>
            <MenuSeparator />
            <MenuItem onClick={() => join(invite)}>
              <MaterialSymbolsLoginRounded />
              Приєднатися
            </MenuItem>
            <MenuItem
              className="text-muted-foreground"
              onClick={() => decline(invite)}
            >
              <MaterialSymbolsCloseRounded />
              Відхилити
            </MenuItem>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
