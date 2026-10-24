import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', elevated = false, interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl border border-[var(--vg-border)] transition-all ${
          elevated ? 'bg-[var(--vg-surface-elevated)] shadow-sm' : 'bg-[var(--vg-surface-main)]'
        } ${
          interactive
            ? 'hover:border-[var(--vg-accent-primary)]/50 hover:bg-[var(--vg-surface-hover)] cursor-pointer'
            : ''
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
