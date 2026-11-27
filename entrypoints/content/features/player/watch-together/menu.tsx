import type { ComponentProps, CSSProperties } from 'react';

import type { WatchRoomProfile } from '@/utils/convex-api';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** Rows of the player's popovers, styled like its dropdown menus. */
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

/** A hue of their own, so members without a picture still tell apart. */
const memberHue = (member: WatchRoomProfile) => {
  let hash = 0;
  for (const char of member.id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  // Steps of the golden angle keep ids that differ by a letter far apart.
  return Math.round(Math.abs(hash) * 137.508) % 360;
};

/** A member's picture, or their initial on their own colour. */
export const MemberFace = ({ member }: { member: WatchRoomProfile }) => (
  <>
    {member.avatar && <AvatarImage src={member.avatar} alt="" />}
    <AvatarFallback
      style={{ '--hue': memberHue(member) } as CSSProperties}
      className="bg-[oklch(0.86_0.07_var(--hue))] font-semibold text-[oklch(0.38_0.09_var(--hue))] dark:bg-[oklch(0.5_0.1_var(--hue))] dark:text-[oklch(0.95_0.03_var(--hue))]"
    >
      {memberName(member)[0]?.toUpperCase()}
    </AvatarFallback>
  </>
);

/** Centred on a row's 16px icon column, so names line up with labels. */
export const MemberAvatar = ({ member }: { member: WatchRoomProfile }) => (
  <Avatar size="sm" className="-mx-0.5 data-[size=sm]:size-5">
    <MemberFace member={member} />
  </Avatar>
);
