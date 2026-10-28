import type { ComponentProps } from 'react';

import type { WatchRoomProfile } from '@/utils/convex-api';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** Rows of the player's popovers, styled like the share menu. */
export const MenuLabel = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn(
      'text-muted-foreground flex items-center gap-2 px-2 py-1.5 text-xs font-medium',
      className,
    )}
    {...props}
  />
);

export const MenuItem = ({ className, ...props }: ComponentProps<'button'>) => (
  <button
    type="button"
    className={cn(
      'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
      className,
    )}
    {...props}
  />
);

export const MenuSeparator = () => (
  <div className="bg-border -mx-1 my-1 h-px" />
);

export const MenuError = ({ children }: { children: string }) => (
  <p role="alert" className="text-destructive px-2 py-1.5 text-xs font-medium">
    {children}
  </p>
);

/** "Title · Епізод 5", where only the title gives way to a narrow row. */
export const RoomSubtitle = ({
  title,
  episode,
}: {
  title?: string;
  episode: number;
}) => (
  <span className="text-muted-foreground flex min-w-0 gap-1 text-xs">
    {title && (
      <>
        <span className="truncate">{title}</span>
        <span aria-hidden>·</span>
      </>
    )}
    <span className="shrink-0">Епізод {episode}</span>
  </span>
);

export const memberName = (member: WatchRoomProfile) =>
  member.username ?? 'Глядач';

export const MemberAvatar = ({
  member,
  className,
}: {
  member: WatchRoomProfile;
  className?: string;
}) => (
  <Avatar size="sm" className={className}>
    {member.avatar && <AvatarImage src={member.avatar} alt="" />}
    <AvatarFallback>{memberName(member)[0]?.toUpperCase()}</AvatarFallback>
  </Avatar>
);
