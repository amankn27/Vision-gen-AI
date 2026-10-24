import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'cyan' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  };

  const variantStyles = {
    default: 'bg-[var(--vg-surface-hover)] text-[var(--vg-text-secondary)] border border-[var(--vg-border)]',
    accent: 'bg-[var(--vg-accent-primary)]/15 text-[var(--vg-accent-primary)] border border-[var(--vg-accent-primary)]/30',
    cyan: 'bg-[var(--vg-accent-cyan)]/15 text-[var(--vg-accent-cyan)] border border-[var(--vg-accent-cyan)]/30',
    success: 'bg-[var(--vg-status-success)]/15 text-[var(--vg-status-success)] border border-[var(--vg-status-success)]/30',
    warning: 'bg-[var(--vg-status-warning)]/15 text-[var(--vg-status-warning)] border border-[var(--vg-status-warning)]/30',
    error: 'bg-[var(--vg-status-error)]/15 text-[var(--vg-status-error)] border border-[var(--vg-status-error)]/30',
    outline: 'bg-transparent text-[var(--vg-text-secondary)] border border-[var(--vg-border)]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
