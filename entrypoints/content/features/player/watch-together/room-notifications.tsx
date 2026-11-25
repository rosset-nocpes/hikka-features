import MaterialSymbolsCoPresentRounded from '~icons/material-symbols/co-present-rounded';

import type { WatchRoom, WatchRoomProfile } from '@/utils/convex-api';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notify } from '@/utils/notify';

import { memberName } from './menu';

/** How long a member's coming or going is shown. */
const MEMBER_NOTICE_MS = 4_000;

export const MemberMedia = ({ member }: { member: WatchRoomProfile }) => (
  <Avatar className="size-9">
    {member.avatar && <AvatarImage src={member.avatar} alt="" />}
    <AvatarFallback>{memberName(member)[0]?.toUpperCase()}</AvatarFallback>
  </Avatar>
);

const eyebrow = (
  <>
    <MaterialSymbolsCoPresentRounded />
    Спільний перегляд
  </>
);

/** Tells who came into the room and who left it since `previous`. */
export function notifyMemberChanges(previous: WatchRoom, room: WatchRoom) {
  const before = new Map(previous.members.map((member) => [member.id, member]));
  const now = new Map(room.members.map((member) => [member.id, member]));

  const show = (member: WatchRoomProfile, joined: boolean) =>
    // One per member: coming back replaces their leaving.
    notify({
      id: `watch-together-member-${member.id}`,
      eyebrow,
      title: memberName(member),
      description: joined ? 'Тепер дивиться з вами' : 'Більше не в кімнаті',
      media: <MemberMedia member={member} />,
      duration: MEMBER_NOTICE_MS,
    });

  for (const [id, member] of now) {
    if (!member.self && !before.has(id)) show(member, true);
  }
  for (const [id, member] of before) {
    if (!member.self && !now.has(id)) show(member, false);
  }
}

/** The room ended on its own, e.g. it closed or opened in another tab. */
export function notifyRoomEnded(message: string) {
  notify({
    id: 'watch-together-ended',
    tone: 'warning',
    eyebrow,
    title: 'Спільний перегляд завершено',
    description: message,
  });
}
