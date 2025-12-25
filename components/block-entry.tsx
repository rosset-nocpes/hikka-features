import React, { type ReactNode } from 'react';

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode;
  className?: string;
}

const BlockEntry = React.forwardRef<HTMLAnchorElement, Props>(
  ({ children, className, ...props }, ref) => {
    return (
      <a
        className={cn(
          'flex items-center gap-2 rounded-lg p-1 font-medium text-sm transition hover:bg-secondary/60',
          className,
        )}
        target="_blank"
        ref={ref}
        {...props}
      >
        {children}
      </a>
    );
  },
);

export default BlockEntry;
