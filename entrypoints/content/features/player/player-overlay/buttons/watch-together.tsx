import { AnimatePresence, motion } from 'motion/react';
import { type FC, type RefObject, useState } from 'react';
import MaterialSymbolsArrowBackRounded from '~icons/material-symbols/arrow-back-rounded';
import MaterialSymbolsCheckRounded from '~icons/material-symbols/check-rounded';
import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';
import MaterialSymbolsCrownOutlineRounded from '~icons/material-symbols/crown-outline-rounded';
import MaterialSymbolsGroupAddOutlineRounded from '~icons/material-symbols/group-add-outline-rounded';
import MaterialSymbolsGroupOutlineRounded from '~icons/material-symbols/group-outline-rounded';
import MaterialSymbolsLinkRounded from '~icons/material-symbols/link-rounded';
import MaterialSymbolsLogoutRounded from '~icons/material-symbols/logout-rounded';
import MaterialSymbolsPersonAddOutlineRounded from '~icons/material-symbols/person-add-outline-rounded';

import type {
  WatchRoom,
  WatchRoomFriend,
  WatchRoomListing,
} from '@/utils/convex-api';

import SwapIcon from '@/components/swap-icon';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useCopy } from '@/hooks/use-copy';
import { useLiveQuery } from '@/hooks/use-live-query';
import { useSettings } from '@/hooks/use-settings';
import { account } from '@/utils/account';
import { convexApi } from '@/utils/convex-api';

import { usePlayer } from '../../context/player-context';
import {
  MemberAvatar,
  MenuError,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  memberName,
  RoomSubtitle,
} from '../../watch-together/menu';
import { openRoom } from '../../watch-together/open-room';
import { useWatchTogether } from '../../watch-together/use-watch-together';
import MenuPages from '../menu-pages';
import ToolbarTooltip from '../toolbar-tooltip';
import { useToolbarMenuPosition, useUiLock } from '../use-ui-lock';

const MotionAvatar = motion.create(Avatar);
const MotionAvatarGroup = motion.create(AvatarGroup);
const MotionAvatarGroupCount = motion.create(AvatarGroupCount);

/** Avatars the toolbar button fits; more collapse into a count. */
const TRIGGER_AVATARS = 3;
/** The top bar on phones keeps its chips small. */
const COMPACT_TRIGGER_AVATARS = 2;
/** How far each avatar tucks under the next (`-space-x-1.5`). */
const AVATAR_OVERLAP = 6;
const spring = { type: 'spring', stiffness: 500, damping: 36 } as const;
const pop = {
  initial: { scale: 0.4, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.4, opacity: 0 },
};

const inviteLink = ({ animeSlug, code }: WatchRoom) => {
  const url = new URL(`/anime/${animeSlug}`, window.location.origin);
  url.searchParams.set('room', code);
  return url.href;
};

/**
 * The newest members, so whoever just joined pops in on the right while the
 * group widens to fit; earlier ones fold into the count on the left.
 */
const RoomAvatars = ({
  room,
  compact,
}: {
  room: WatchRoom;
  compact?: boolean;
}) => {
  const { members } = room;
  const max = compact ? COMPACT_TRIGGER_AVATARS : TRIGGER_AVATARS;
  const shown = members.length > max ? members.slice(-(max - 1)) : members;
  const hidden = members.length - shown.length;
  const size = compact ? 20 : 24;
  const slots = shown.length + (hidden > 0 ? 1 : 0);

  return (
    <MotionAvatarGroup
      className="relative -space-x-1.5 *:data-[slot=avatar]:ring-[1.5px] *:data-[slot=avatar-group-count]:ring-[1.5px]"
      initial={false}
      animate={{ width: size + (slots - 1) * (size - AVATAR_OVERLAP) }}
      transition={spring}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {hidden > 0 && (
          <MotionAvatarGroupCount
            key="count"
            layout
            {...pop}
            transition={spring}
            className={cn(
              'overflow-hidden text-xs font-medium tabular-nums',
              compact &&
                'text-[10px] group-has-data-[size=sm]/avatar-group:size-5',
            )}
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={hidden}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={spring}
              >
                +{hidden}
              </motion.span>
            </AnimatePresence>
          </MotionAvatarGroupCount>
        )}
        {shown.map((member) => (
          <MotionAvatar
            key={member.id}
            layout
            {...pop}
            transition={spring}
            size="sm"
            className={cn(compact && 'data-[size=sm]:size-5')}
          >
            {member.avatar && <AvatarImage src={member.avatar} alt="" />}
            <AvatarFallback>
              {memberName(member)[0]?.toUpperCase()}
            </AvatarFallback>
          </MotionAvatar>
        ))}
      </AnimatePresence>
    </MotionAvatarGroup>
  );
};

/** An invite or a friend's open room, as a row that joins it. */
const ListingItem = ({
  listing,
  invited,
}: {
  listing: WatchRoomListing;
  invited?: boolean;
}) => {
  const slug = usePlayer((state) => state.slug);

  return (
    <MenuItem onClick={() => openRoom(listing.animeSlug, listing.code)}>
      <MemberAvatar
        member={listing.friend}
        className="-mx-0.5 data-[size=sm]:size-5"
      />
      <span className="grid min-w-0 flex-1 leading-tight">
        <span className="flex min-w-0 items-baseline gap-1">
          <span className="truncate">{memberName(listing.friend)}</span>
          {invited && (
            <span className="text-muted-foreground shrink-0 text-xs">
              запрошує
            </span>
          )}
        </span>
        <RoomSubtitle
          title={
            listing.animeSlug === slug
              ? undefined
              : (listing.animeTitle ?? listing.animeSlug)
          }
          episode={listing.episode}
        />
      </span>
    </MenuItem>
  );
};

const StartMenu = () => {
  const { status, error, create } = useWatchTogether();
  const { convexSession } = useSettings();
  const inbox = useLiveQuery(
    convexApi.watchRooms.inbox,
    convexSession ? {} : 'skip',
  )?.data;
  const listed = (inbox?.invites.length ?? 0) + (inbox?.rooms.length ?? 0);

  return (
    <>
      <MenuLabel>Дивитися разом</MenuLabel>
      <p className="text-muted-foreground px-2 pb-1.5 text-xs text-pretty">
        Пауза, перемотка й вибір серії спільні для всіх у кімнаті
      </p>
      <MenuSeparator />
      <MenuItem disabled={status === 'connecting'} onClick={create}>
        {status === 'connecting' ? (
          <Spinner />
        ) : (
          <MaterialSymbolsGroupAddOutlineRounded />
        )}
        {convexSession ? 'Створити кімнату' : 'Увійти й створити кімнату'}
      </MenuItem>
      {error && <MenuError>{error}</MenuError>}
      {listed > 0 && (
        <>
          <MenuSeparator />
          <MenuLabel>Друзі дивляться</MenuLabel>
          <div className="flex max-h-48 flex-col overflow-y-auto overscroll-contain">
            {inbox?.invites.map((invite) => (
              <ListingItem key={invite.code} listing={invite} invited />
            ))}
            {inbox?.rooms.map((room) => (
              <ListingItem key={room.code} listing={room} />
            ))}
          </div>
        </>
      )}
    </>
  );
};

const FriendRow = ({ friend }: { friend: WatchRoomFriend }) => {
  const invite = useWatchTogether((state) => state.invite);
  const [sending, setSending] = useState(false);

  const status =
    friend.status === 'member' ? (
      'у кімнаті'
    ) : friend.status === 'invited' ? (
      <>
        <MaterialSymbolsCheckRounded className="text-success" />
        запрошено
      </>
    ) : null;

  const content = (
    <>
      <MemberAvatar member={friend} className="-mx-0.5 data-[size=sm]:size-5" />
      <span className="flex-1 truncate">{memberName(friend)}</span>
      {status ? (
        <span className="text-muted-foreground flex items-center gap-1 text-xs [&_svg]:size-3.5!">
          {status}
        </span>
      ) : sending ? (
        <Spinner />
      ) : (
        <span className="text-muted-foreground text-xs">запросити</span>
      )}
    </>
  );

  if (status) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
        {content}
      </div>
    );
  }
  return (
    <MenuItem
      disabled={sending}
      onClick={() => {
        setSending(true);
        // Resolves once the list shows the friend as invited.
        invite(friend.id)
          .catch(console.error)
          .finally(() => setSending(false));
      }}
    >
      {content}
    </MenuItem>
  );
};

const FriendsPage = ({
  room,
  onBack,
}: {
  room: WatchRoom;
  onBack: () => void;
}) => {
  const friends = useLiveQuery(convexApi.watchRooms.friends, {
    code: room.code,
  })?.data;

  return (
    <>
      <div className="flex max-h-60 flex-col overflow-y-auto overscroll-contain">
        {friends === undefined ? (
          <div className="text-muted-foreground flex items-center gap-2 px-2 py-1.5 text-sm">
            <Spinner />
            Шукаю друзів
          </div>
        ) : friends.length === 0 ? (
          <p className="text-muted-foreground px-2 py-1.5 text-xs text-pretty">
            Тут будуть друзі з розширенням: ті, з ким ви взаємно підписані на
            hikka.io
          </p>
        ) : (
          friends.map((friend) => <FriendRow key={friend.id} friend={friend} />)
        )}
      </div>
      <MenuSeparator />
      <MenuItem className="text-muted-foreground font-medium" onClick={onBack}>
        <MaterialSymbolsArrowBackRounded />
        Запросити друзів
      </MenuItem>
    </>
  );
};

const RoomMenu = ({
  room,
  onInvite,
  onLeave,
}: {
  room: WatchRoom;
  onInvite: () => void;
  onLeave: () => void;
}) => {
  const { error, leave, share } = useWatchTogether();
  const { copied, copy } = useCopy();
  const [sharing, setSharing] = useState<boolean>();
  const isOwner = room.members.some(
    (member) => member.self && member.id === room.ownerId,
  );

  const toggleSharing = (friendsCanJoin: boolean) => {
    setSharing(friendsCanJoin);
    // Resolves once the room reflects it.
    share(friendsCanJoin)
      .catch(console.error)
      .finally(() => setSharing(undefined));
  };

  return (
    <>
      <MenuLabel>
        <span className="truncate">Спільний перегляд</span>
        <span className="ml-auto tracking-wide tabular-nums">{room.code}</span>
      </MenuLabel>
      <ul className="flex max-h-48 flex-col overflow-y-auto overscroll-contain">
        {room.members.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-2 px-2 py-1.5 text-sm"
          >
            {/* Centred on the 16px icon column, so names line up with labels. */}
            <MemberAvatar
              member={member}
              className="-mx-0.5 data-[size=sm]:size-5"
            />
            <span className="truncate">{memberName(member)}</span>
            {member.id === room.ownerId && (
              <MaterialSymbolsCrownOutlineRounded
                aria-label="Власник кімнати"
                className="text-muted-foreground size-3.5 shrink-0"
              />
            )}
            {member.self && (
              <span className="text-muted-foreground ml-auto text-xs">ви</span>
            )}
          </li>
        ))}
      </ul>
      {error && <MenuError>{error}</MenuError>}
      <MenuSeparator />
      <label
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 text-sm select-none',
          isOwner ? 'cursor-pointer' : 'text-muted-foreground',
        )}
      >
        <Switch
          size="sm"
          checked={sharing ?? room.friendsCanJoin}
          disabled={!isOwner || sharing !== undefined}
          onCheckedChange={toggleSharing}
        />
        Відкрито для друзів
      </label>
      <MenuSeparator />
      <MenuItem onClick={onInvite}>
        <MaterialSymbolsPersonAddOutlineRounded />
        Запросити друзів
        <MaterialSymbolsChevronRightRounded className="text-muted-foreground ml-auto" />
      </MenuItem>
      <MenuItem onClick={() => void copy(inviteLink(room))}>
        <SwapIcon
          active={!!copied}
          on={<MaterialSymbolsCheckRounded className="text-success" />}
          off={<MaterialSymbolsLinkRounded />}
        />
        {copied ? 'Скопійовано' : 'Копіювати посилання'}
      </MenuItem>
      <MenuItem
        className="text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive dark:hover:bg-destructive/20 dark:focus-visible:bg-destructive/20"
        onClick={() => {
          leave();
          onLeave();
        }}
      >
        <MaterialSymbolsLogoutRounded />
        Вийти з кімнати
      </MenuItem>
    </>
  );
};

interface Props {
  /** Toolbar group the menu lines up with, rather than the button itself. */
  anchor: RefObject<HTMLElement | null>;
  /** Below the button in the top bar, above it in the bottom toolbar. */
  side?: 'top' | 'bottom';
  compact?: boolean;
  className?: string;
}

const WatchTogether: FC<Props> = ({
  anchor,
  side = 'top',
  compact,
  className,
}) => {
  const position = useToolbarMenuPosition(anchor, side);
  const { status, room } = useWatchTogether();
  const signedIn = useSettings((state) => Boolean(state.convexSession));
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<'menu' | 'friends'>('menu');
  useUiLock(open);

  const joined = status === 'joined' ? room : undefined;
  const friendsPage = page === 'friends' && joined;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setPage('menu');
    // Friends' rooms and the invite list depend on who follows whom.
    if (signedIn) void account.refreshFriends();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <ToolbarTooltip
        label={joined ? 'Спільний перегляд' : 'Дивитися разом'}
        disabled={open}
      >
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(className, joined && 'w-auto px-1')}
            >
              {joined ? (
                <RoomAvatars room={joined} compact={compact} />
              ) : (
                <MaterialSymbolsGroupOutlineRounded />
              )}
            </Button>
          }
        />
      </ToolbarTooltip>
      <PopoverContent
        className="ring-border w-56 gap-0 rounded-lg p-1"
        {...position}
      >
        <MenuPages
          page={friendsPage ? 'friends' : joined ? 'room' : 'start'}
          direction={friendsPage ? 1 : -1}
          side={side}
        >
          {friendsPage ? (
            <FriendsPage room={joined} onBack={() => setPage('menu')} />
          ) : joined ? (
            <RoomMenu
              room={joined}
              onInvite={() => setPage('friends')}
              onLeave={() => setOpen(false)}
            />
          ) : (
            <StartMenu />
          )}
        </MenuPages>
      </PopoverContent>
    </Popover>
  );
};

export default WatchTogether;
