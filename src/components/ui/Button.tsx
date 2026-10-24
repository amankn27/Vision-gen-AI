import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vg-accent-primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-3.5 py-2 gap-2 h-9.5',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
    };

    const variantStyles = {
      primary:
        'bg-[var(--vg-accent-primary)] text-white hover:bg-[var(--vg-accent-primary-hover)] active:scale-[0.98] border border-transparent shadow-sm',
      secondary:
        'bg-[var(--vg-surface-elevated)] text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] border border-[var(--vg-border)]',
      outline:
        'bg-transparent text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)]',
      ghost:
        'bg-transparent text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] border border-transparent',
      destructive:
        'bg-[var(--vg-status-error)]/15 text-[var(--vg-status-error)] hover:bg-[var(--vg-status-error)]/25 border border-[var(--vg-status-error)]/30',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
