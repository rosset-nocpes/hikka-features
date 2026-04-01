import React, { type ReactNode } from 'react';

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode;
  className?: string;
}

const BlockEntry = React.forwardRef<HTMLAnchorElement, Props>(
  ({ children, className, ...props }, ref) => {
    return (
      <a
        className={cn('flex items-center gap-4', className)}
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
