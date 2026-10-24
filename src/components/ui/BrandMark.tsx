import React from 'react';

interface BrandMarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textMap = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-bold',
    lg: 'text-xl font-bold',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Geometric Aperture & Light Spark Motif */}
      <div
        className={`${sizeMap[size]} relative flex items-center justify-center rounded-lg bg-gradient-to-br from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] p-[1.5px] shadow-sm`}
        aria-hidden="true"
      >
        <div className="w-full h-full bg-[#0B0D12] rounded-[7px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle inner lens aperture rays */}
          <svg
            className="w-4/5 h-4/5 text-[#8B5CF6]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" className="opacity-40" />
            <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2" fill="currentColor" fillOpacity="0.3" />
            <circle cx="12" cy="12" r="2.5" fill="#67E8F9" stroke="none" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className={`tracking-tight ${textMap[size]} text-[var(--vg-text-primary)] flex items-center gap-1`}>
            <span>VisionGen</span>
            <span className="text-[var(--vg-accent-primary)] font-extrabold text-xs tracking-wider uppercase px-1.5 py-0.5 rounded bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)]">
              AI
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
