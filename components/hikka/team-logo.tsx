import type { FC } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Props {
  title: string;
  logo?: string;
  className?: string;
}

/** A team's logo, or its initial while there is none. */
const TeamLogo: FC<Props> = ({ title, logo, className }) => (
  <Avatar className={cn('rounded-lg after:rounded-lg', className)}>
    <AvatarImage loading="lazy" src={logo} alt="" />
    <AvatarFallback className="bg-secondary/40 text-muted-foreground rounded-lg font-medium">
      {title.match(/\p{L}|\p{N}/u)?.[0]?.toUpperCase()}
    </AvatarFallback>
  </Avatar>
);

export default TeamLogo;
