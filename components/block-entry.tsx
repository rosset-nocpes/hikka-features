import { FC, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  className?: string;
  href?: string;
}

const BlockEntry: FC<Props> = ({ children, className, href }) => {
  return (
    <a
      className={cn(
        'flex items-center gap-2 rounded-sm p-1 text-sm font-medium transition hover:bg-secondary/60',
        className,
      )}
      href={href}
      target="_blank"
    >
      {children}
    </a>
  );
};

export default BlockEntry;
